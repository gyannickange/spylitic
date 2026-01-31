# AI Coding Best Practices for Ruby on Rails

This document outlines the architectural patterns and coding standards used in this project. When building new features or a new project inspired by this codebase, adhere to these practices.

## 1. Architectural Patterns

### 1.1 Service Objects

Move complex business logic out of controllers and models into dedicated services.

- **Location**: `app/services/`
- **Return Type**: Use a `ServiceResult` object to return `success`, `message`, and `data`.
- **Example**:
  ```ruby
  class MyService
    def call(params)
      # ... logic ...
      ServiceResult.new(success: true, message: "Success!", data: { result: result })
    end
  end
  ```

### 1.2 Decorators

Handle view-specific logic (formatting, CSS classes) in decorators instead of models or helpers.

- **Library**: `draper`
- **Location**: `app/decorators/`
- **Example**: `SurveyFormDecorator` handles status badge colors and date formatting.

### 1.3 Policies

Use Pundit for all authorization logic.

- **Location**: `app/policies/`
- **Standard**: Every controller action should call `authorize @record`.

### 1.4 Scopes & Fat Models

Keep controllers thin by moving query logic into models using scopes.

- Use `Arel.sql` for complex SQL queries to avoid breaking eager loading and pagination.
- Filter logic can be delegated to a service if it becomes too complex (see `User.filtered_by_criteria`).

### 1.5 Model Patterns

Models should contain business logic, validations, associations, and query methods.

#### Associations

- Use standard Rails associations: `has_many`, `belongs_to`, `has_many :through`
- Always specify `dependent` options: `:destroy`, `:nullify`, `:delete_all`
- Use `optional: true` for optional `belongs_to` associations

**Example**:

```ruby
class SurveyForm < ApplicationRecord
  belongs_to :created_by, class_name: "User", foreign_key: :created_by_id
  belongs_to :survey_group, optional: true
  has_many :survey_versions, dependent: :destroy
  has_many :responses, through: :survey_versions
end
```

#### Validations

- Use conditional validations with `if:` or `unless:` for context-specific rules
- Validate presence, uniqueness, and format as needed
- Group validations logically

**Example**:

```ruby
class User < ApplicationRecord
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :role, presence: true
  validates :birthdate, presence: true, if: -> { member? }
  validates :terms_accepted, acceptance: { accept: true }, on: :create
end
```

#### Enums

- Use string enums for better readability and database storage
- Define enums with explicit values
- Use `prefix:` option when enum names might conflict

**Example**:

```ruby
class User < ApplicationRecord
  enum :role, { member: "member", admin: "admin" }
  enum :gender, { male: "male", female: "female" }, prefix: :gender
  enum :employment_status, {
    employed: "employed",
    unemployed: "unemployed",
    student: "student"
  }, prefix: :employment
end
```

#### Callbacks

- Prefer `after_commit` over `after_save` for external operations (jobs, emails)
- Use `before_save` for data normalization
- Keep callbacks simple; extract complex logic to methods

**Example**:

```ruby
class SurveyGroup < ApplicationRecord
  before_save :normalize_array_fields

  def normalize_array_fields
    self.genders = Array(genders).reject(&:blank?).presence || []
    self.provinces = Array(provinces).reject(&:blank?).presence || []
  end
end

class User < ApplicationRecord
  after_commit :enqueue_assign_to_matching_groups, on: [:create, :update]

  private

  def enqueue_assign_to_matching_groups
    return unless member?
    profile_attributes = %w[birthdate gender province]
    if previously_new_record? || (saved_changes.keys & profile_attributes).any?
      AssignUserToGroupsJob.perform_later(id)
    end
  end
end
```

#### PostgreSQL Array Fields

- Use PostgreSQL arrays for multi-value fields (genders, provinces, etc.)
- Normalize arrays in callbacks to remove empty values
- Use GIN indexes for array columns in migrations
- Check for presence with `.present? && .any?`

**Example**:

```ruby
# Migration
add_index :survey_groups, :genders, using: :gin

# Model
class SurveyGroup < ApplicationRecord
  before_save :normalize_array_fields

  def normalize_array_fields
    self.genders = Array(genders).reject(&:blank?).presence || []
  end

  def has_member_filters?
    (genders.present? && genders.any?) ||
      (provinces.present? && provinces.any?)
  end
end
```

#### Instance Methods

- Group instance methods logically (query methods, status checks, calculations)
- Use descriptive method names ending with `?` for boolean methods
- Delegate complex logic to services when appropriate

**Example**:

```ruby
class SurveyForm < ApplicationRecord
  def answered_by?(user)
    return false unless user.present? && published_version.present?
    Response.exists?(user: user, survey_version: published_version)
  end

  def profile_complete?
    return true unless member?
    birthdate.present? && birthplace.present? && gender.present?
  end
end
```

### 1.6 Concerns

Use concerns to share code between controllers or models.

#### Controller Concerns

- Extract shared authentication/authorization logic
- Use `extend ActiveSupport::Concern`
- Define private methods for shared behavior

**Example** (`app/controllers/concerns/authenticatable.rb`):

```ruby
module Authenticatable
  extend ActiveSupport::Concern

  included do
    # Shared setup
  end

  private

  def ensure_admin!
    unless user_signed_in? && current_user.admin?
      redirect_to new_user_session_path, alert: I18n.t("errors.unauthorized")
    end
  end

  def pundit_user
    current_user
  end
end
```

**Usage in Controller**:

```ruby
class ApplicationController < ActionController::Base
  include Authenticatable
end
```

#### When to Use Concerns vs Services

- **Concerns**: Shared behavior across controllers/models (authentication, authorization helpers)
- **Services**: Business logic that doesn't belong in models or controllers
- **Decorators**: View-specific formatting and presentation logic

## 2. Internationalization (i18n)

This project is built for multi-language support (default: French `fr`, secondary: English `en`).

### 2.1 Localization Rules

- **Never** hardcode strings in views or controllers. Use `I18n.t("key")`.
- **Routes**: Localize routes using scopes in `config/routes.rb`. Use `path_names` for Devise.
- **Models**: Use enums for statuses and translate them in YAML files.

### 2.2 Path Helpers

When routes are localized, use helper methods in `ApplicationController` to handle locale-specific path generation if needed (e.g., `edit_profile_path_helper`).

## 3. UI and Frontend

### 3.1 Styling

- **Framework**: Tailwind CSS.
- **Shared Components**: Use partials in `app/views/shared/` for reusable UI elements like buttons, badges, and cards.
- **Dynamic Content**: Use Hotwire (Turbo) and Stimulus for interactivity.

### 3.2 Tailwind CSS Configuration

#### Configuration File

- **Location**: `config/tailwind.config.js`
- **Main Stylesheet**: `app/assets/tailwind/application.css`

#### Key Configuration Details

**Content Paths** (for JIT compilation):

```javascript
content: [
  "./app/views/**/*.html.erb",
  "./app/helpers/**/*.rb",
  "./app/assets/stylesheets/**/*.css",
  "./app/javascript/**/*.js",
];
```

**Dark Mode**:

- **Mode**: `"selector"` (class-based)
- **Implementation**: Toggle via `dark` class on `<html>` element
- **Controller**: `app/javascript/controllers/theme_controller.js` handles theme switching
- **Storage**: Theme preference saved in `localStorage`

**Custom Theme Extensions**:

1. **Custom Colors**:

   - `theme-green`: `#00d065` - Primary brand color
   - Usage: `bg-theme-green`, `text-theme-green`, `border-theme-green`, `focus:ring-theme-green`
   - With opacity: `bg-theme-green/90`, `bg-theme-green/10`, `bg-theme-green/20`

2. **Custom Fonts**:
   - `font-primary`: Uses CSS variable `--primary-font` (defaults to Montserrat)
   - `font-montserrat`: Direct Montserrat font family
   - Font weights: 300, 400, 500, 600, 700, 800
   - Font is loaded from Google Fonts in `application.css`

#### Dark Mode Best Practices

**Always provide dark mode variants** for colors, backgrounds, borders, and text:

```erb
<!-- Good: Includes dark mode -->
<div class="bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100">
  <button class="bg-theme-green hover:bg-theme-green/90 text-white">
    Click me
  </button>
</div>

<!-- Bad: Missing dark mode -->
<div class="bg-white text-black">
  <button class="bg-green-500">Click me</button>
</div>
```

**Common Dark Mode Patterns**:

- **Backgrounds**: `bg-white dark:bg-gray-800` or `bg-slate-100 dark:bg-slate-700`
- **Text**: `text-slate-900 dark:text-slate-100` or `text-slate-700 dark:text-slate-300`
- **Borders**: `border-gray-300 dark:border-slate-600`
- **Hover states**: `hover:bg-slate-50 dark:hover:bg-slate-700`
- **Badges**: Use opacity for dark mode (e.g., `dark:bg-green-900/30 dark:text-green-400`)

#### Using Custom Colors

**Primary Brand Color (`theme-green`)**:

- Use for primary actions, links, focus states, and brand elements
- Examples:

  ```erb
  <!-- Primary button -->
  <button class="bg-theme-green hover:bg-theme-green/90 text-white">

  <!-- Focus ring -->
  <input class="focus:ring-theme-green focus:border-theme-green">

  <!-- Icon background -->
  <div class="bg-theme-green/10 dark:bg-theme-green/20">
    <svg class="text-theme-green">
  </div>
  ```

#### Shared Component Patterns

**Buttons** (`shared/_button.html.erb`):

- Types: `primary`, `secondary`, `danger`, `success`
- Primary uses `theme-green`
- Always includes dark mode variants
- Includes focus states: `focus:ring-2 focus:ring-offset-2`

**Badges** (`shared/_badge.html.erb`):

- Colors: `green`, `blue`, `purple`, `orange`, `yellow`, `red`, `gray`, `slate`
- Pattern: `bg-{color}-100 text-{color}-800 dark:bg-{color}-900/30 dark:text-{color}-400`

#### Form Elements

**Inputs, selects, checkboxes**:

```erb
<!-- Text input -->
<input class="block w-full rounded-md border-gray-300 dark:border-slate-600
              shadow-sm focus:border-theme-green focus:ring-theme-green
              dark:bg-slate-700 dark:text-white">

<!-- Checkbox -->
<%= check_box_tag :option, value, checked,
    class: "rounded border-gray-300 dark:border-slate-600
            text-theme-green focus:ring-theme-green" %>
```

#### Color Palette Guidelines

**Important**: When creating new UI components or styling elements, **always ask the user what color scheme they want to use** rather than assuming. Different components may require different color treatments based on context and purpose.

**Preferred color scales**:

- **Slate**: Primary neutral (slate-50 to slate-900)
- **theme Blue**: Brand primary (#2365b7)
- **Status colors**: Use standard Tailwind colors (green, red, yellow, etc.) with dark mode variants

**Color Selection Process**:

1. **Ask the user** what color/theme they want for the component:

   - Primary action? → Use `theme-green`
   - Status indicator? → Ask: success (green), warning (yellow), error (red), info (blue)?
   - Neutral/secondary? → Use slate scale
   - Badge/label? → Ask which color from available badge colors

2. **Don't assume** - Different contexts may need different colors even for similar components

3. **Document the choice** - If creating a reusable component, document which colors it supports

**Avoid**:

- Hardcoded hex colors in classes (use config or CSS variables)
- Missing dark mode variants
- Inconsistent spacing (use Tailwind spacing scale)
- **Assuming colors without asking the user first**

### 3.3 Form Handling

- Use standard Rails `form_with`.
- Provide consistent error handling using the `shared/form_errors` partial.
- Use `shared/_form_field` partial for consistent form field styling.

**Form Field Partial** (`shared/_form_field.html.erb`):

- Supports: `text`, `email`, `password`, `text_area`, `select`, `date`, `datetime`, `number`
- Automatically includes dark mode variants
- Includes error display
- Usage:
  ```erb
  <%= render partial: "shared/form_field",
             locals: { form: f, field: :title, label: "Title", type: "text" } %>
  ```

### 3.4 Admin Panel Patterns

**Important**: Admin panels MUST use shared components and follow DRY principles.

#### Shared Components Available

**Always use these shared components in admin views:**

1. **`shared/dashboard_header`** - Page title and subtitle

   ```erb
   <%= render "shared/dashboard_header", title: t("surveys.title") %>
   ```

2. **`shared/pagination`** - Pagination controls (uses Pagy)

   ```erb
   <%= render partial: "shared/pagination", locals: { pagy: @pagy } if @pagy.present? %>
   ```

3. **`shared/empty_state`** - Empty state messages

   ```erb
   <%= render partial: "shared/empty_state",
              locals: { message: t("surveys.no_surveys"),
                       icon: "📊",
                       action_text: t("surveys.new"),
                       action_url: new_survey_form_path } %>
   ```

4. **`shared/button`** - Consistent buttons

   ```erb
   <%= render partial: "shared/button",
              locals: { text: t("actions.save"), type: "primary", submit: true } %>
   ```

5. **`shared/badge`** - Status badges

   ```erb
   <%= render partial: "shared/badge", locals: { text: "Published", color: "green" } %>
   ```

6. **`shared/form_errors`** - Form validation errors

   ```erb
   <%= render "shared/form_errors", object: @survey_form %>
   ```

7. **`shared/form_field`** - Form inputs with consistent styling

   ```erb
   <%= render partial: "shared/form_field",
              locals: { form: f, field: :title, label: "Title", type: "text" } %>
   ```

8. **`shared/flash_messages`** - Flash notifications (included in layout)

#### Admin View Structure

**Standard admin index view pattern:**

```erb
<% content_for :title, t("surveys.title") %>

<%= render "shared/dashboard_header", title: t("surveys.title") %>

<div class="mb-4 flex justify-between items-center">
  <%= link_to t("surveys.new"), new_survey_form_path,
      class: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-theme-green hover:bg-theme-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-green" %>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
  <%= render partial: "survey_forms/table", locals: { surveys: @survey_forms } %>
  <%= render partial: "shared/pagination", locals: { pagy: @pagy } if @pagy.present? %>
</div>
```

#### Table Patterns

**Option 1: Use generic `shared/table` partial** (when structure is simple):

```erb
<%= render partial: "shared/table",
           locals: { headers: [t("surveys.title"), t("surveys.status")],
                    rows: @surveys,
                    decorator: true } do |survey| %>
  <tr>
    <td><%= survey.title %></td>
    <td><%= render "shared/badge", text: survey.status, color: "green" %></td>
  </tr>
<% end %>
```

**Option 2: Create resource-specific table partial** (when structure is complex):

- Location: `app/views/{resource}/_table.html.erb`
- Use consistent table styling classes
- Include empty state handling
- Example: `app/views/survey_forms/_table.html.erb`

**Option 3: Inline table** (only for very simple, one-off tables):

- Use the same Tailwind classes as shared components
- Always include dark mode variants
- Include empty state handling

#### Container/Card Pattern

**Standard container for admin content:**

```erb
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
  <!-- Content here -->
</div>
```

#### Navigation

- Use `shared/admin_navbar` for admin navigation
- Navigation links should be consistent across admin views
- Use active state styling: `bg-theme-green text-white` when active

#### DRY Principles for Admin Panels

**DO:**

- ✅ Use shared components for common UI elements
- ✅ Extract repeated patterns into partials
- ✅ Use decorators for view logic (badge colors, date formatting)
- ✅ Use consistent Tailwind classes
- ✅ Create resource-specific partials when patterns repeat

**DON'T:**

- ❌ Duplicate table structures - use `shared/table` or create a partial
- ❌ Hardcode navigation - use shared navbar component
- ❌ Repeat form field markup - use `shared/form_field`
- ❌ Create one-off button styles - use `shared/button`
- ❌ Skip dark mode variants

#### When to Create New Shared Components

Create a new shared component when:

- The same UI pattern appears in 3+ places
- The pattern is complex enough to benefit from abstraction
- The pattern needs consistent styling/behavior

Examples of good shared components:

- `shared/table` - Generic table wrapper
- `shared/form_field` - Reusable form inputs
- `shared/stat_card` - Statistics display cards
- `shared/activity_item` - Activity feed items

### 3.5 Stimulus Controllers (JavaScript)

Use Stimulus for JavaScript interactivity. Stimulus controllers are lightweight and work with HTML data attributes.

#### Controller Structure

- Location: `app/javascript/controllers/`
- Naming: `snake_case_controller.js`
- Export default class extending `Controller`

**Basic Pattern**:

```javascript
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["element"];
  static values = { count: Number };

  connect() {
    // Called when controller connects to DOM
  }

  actionMethod(event) {
    event.preventDefault();
    // Handle action
  }
}
```

#### Common Controllers in Project

**1. Theme Controller** (`theme_controller.js`):

- Handles dark mode switching
- Stores preference in `localStorage`
- Falls back to system preference

**2. Flash Controller** (`flash_controller.js`):

- Removes flash messages on click or animation end
- Simple remove functionality

**3. Select All Controller** (`select_all_controller.js`):

- Manages checkbox selection (select all/none)
- Uses targets: `selectAll`, `selectAllHeader`, `checkbox`
- Updates state when individual checkboxes change

**Example Usage**:

```erb
<div data-controller="select-all">
  <input type="checkbox" data-select-all-target="selectAll"
         data-action="change->select-all#toggleAll">
  <% items.each do |item| %>
    <input type="checkbox" data-select-all-target="checkbox"
           data-action="change->select-all#updateCheckbox">
  <% end %>
</div>
```

**4. Nested Form Controller** (`nested_form_controller.js`):

- Handles dynamic form fields (add/remove)
- Uses `NEW_RECORD` placeholder for unique IDs
- Supports nested nested forms

**5. Dropdown Controller** (`dropdown_controller.js`):

- Manages dropdown menu open/close state

**6. Password Toggle Controller** (`password_toggle_controller.js`):

- Toggles password field visibility

#### Data Attributes

- `data-controller="controller-name"` - Attach controller to element
- `data-{controller}-target="target-name"` - Define targets
- `data-{controller}-action="event->controller#method"` - Define actions
- `data-{controller}-{value}-value="value"` - Define values

**Example**:

```erb
<div data-controller="flash" data-action="animationend->flash#remove">
  <button data-action="click->flash#remove">Close</button>
</div>
```

#### Best Practices

- Keep controllers focused on a single responsibility
- Use targets to reference DOM elements
- Use values for configuration
- Handle errors gracefully (try/catch for localStorage, etc.)
- Reinitialize nested controllers when adding dynamic content

## 4. Background Processing

- **Tool**: ActiveJob with Solid Queue (database-backed).
- **Use Case**: Use for long-running tasks, bulk operations, or third-party API calls.

### 4.1 Job Structure

**Basic Pattern**:

```ruby
class MyJob < ApplicationJob
  queue_as :default

  def perform(arg1, arg2)
    # Job logic here
  end
end
```

### 4.2 Error Handling

**Retry Logic**:

- Use `retry_on` for transient errors with exponential backoff
- Use `discard_on` for errors that shouldn't be retried (e.g., deleted records)

**Example**:

```ruby
class AssignUserToGroupsJob < ApplicationJob
  queue_as :default

  # Don't retry on deserialization errors (user might be deleted)
  discard_on ActiveJob::DeserializationError

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user&.member?

    begin
      SurveyGroupAutoAssignmentService.new(user).assign_to_matching_groups
    rescue => e
      Rails.logger.error("Auto-assignment failed for user #{user_id}: #{e.message}")
      # Don't raise - allow job to complete
    end
  end
end
```

**With Retries**:

```ruby
class SurveyGroupBulkMemberAssignmentJob < ApplicationJob
  queue_as :default

  # Retry up to 3 times with exponential backoff
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  def perform(survey_group_id, filter_params = {})
    survey_group = SurveyGroup.find(survey_group_id)

    begin
      # Process in batches
      # Update progress
      survey_group.update!(member_sync_status: "completed")
    rescue => e
      survey_group.update!(
        member_sync_status: "failed",
        member_sync_error: "#{e.class}: #{e.message}"
      )
      raise # Re-raise to trigger retry mechanism
    end
  end
end
```

### 4.3 Bulk Operations

- Process records in batches to avoid memory issues
- Update progress status for long-running jobs
- Use `insert_all` for bulk inserts with `unique_by` to handle duplicates

**Example**:

```ruby
def perform(survey_group_id)
  batch_size = 1000
  users_to_add.in_batches(of: batch_size) do |batch|
    records = batch.map { |user| { survey_group_id: id, user_id: user.id } }
    SurveyGroupUser.insert_all(records, unique_by: [:survey_group_id, :user_id])
    update!(member_sync_progress: batch_number)
  end
end
```

### 4.4 When to Use Jobs vs Services

- **Jobs**: Asynchronous operations, long-running tasks, external API calls, bulk operations
- **Services**: Synchronous business logic, immediate processing, complex calculations
- **Both**: Jobs can call services to keep logic organized

## 5. Database & Migrations

### 5.1 Migration Patterns

- Use `change` method for reversible migrations
- Always add indexes for foreign keys and frequently queried columns
- Use `null: false` for required fields
- Add timestamps with `t.timestamps`

**Example**:

```ruby
class CreateSurveyGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :survey_groups do |t|
      t.string :name, null: false
      t.text :description
      t.date :min_birthdate
      t.date :max_birthdate
      t.string :genders, array: true, default: []

      t.timestamps
    end

    add_index :survey_groups, :name
  end
end
```

### 5.2 PostgreSQL Array Columns

- Use `array: true` for PostgreSQL array columns
- Set `default: []` for empty arrays
- Add GIN indexes for array columns to improve query performance

**Example**:

```ruby
create_table :survey_groups do |t|
  t.string :genders, array: true, default: []
  t.string :provinces, array: true, default: []
  t.bigint :profession_ids, array: true, default: []
end

# Add GIN indexes for array columns
add_index :survey_groups, :genders, using: :gin
add_index :survey_groups, :provinces, using: :gin
add_index :survey_groups, :profession_ids, using: :gin
```

### 5.3 Indexes

- Add indexes for foreign keys
- Add indexes for columns used in WHERE clauses
- Use composite indexes for multi-column queries
- Use GIN indexes for array and JSONB columns

**Example**:

```ruby
add_index :survey_group_users, [:survey_group_id, :user_id], unique: true
add_index :users, :email, unique: true
add_index :responses, [:user_id, :survey_version_id]
```

### 5.4 Multi-Database Setup

This project uses multiple databases:

- **primary**: Main application database
- **cache**: Solid Cache (Rails.cache)
- **queue**: Solid Queue (ActiveJob)
- **cable**: Solid Cable (Action Cable)

Configure in `config/database.yml`:

```yaml
production:
  primary: &primary_production
    database: app_production
  cache:
    <<: *primary_production
    database: app_production_cache
    migrations_paths: db/cache_migrate
  queue:
    <<: *primary_production
    database: app_production_queue
    migrations_paths: db/queue_migrate
```

## 6. Error Handling & Flash Messages

### 6.1 Flash Messages

Use flash messages to provide user feedback after actions.

**Types**:

- `notice` - Success messages (green)
- `alert` - Error/warning messages (red)

**Usage in Controllers**:

```ruby
def create
  if @record.save
    redirect_to records_path, notice: t("records.created_successfully")
  else
    flash.now[:alert] = t("records.create_error")
    render :new, status: :unprocessable_entity
  end
end
```

**Display in Views**:

- Use the `shared/_flash_messages` partial
- Flash messages auto-dismiss via Stimulus controller
- Include dark mode styling

**Example** (`app/views/shared/_flash_messages.html.erb`):

```erb
<% if notice.present? %>
  <div class="rounded-md bg-green-50 dark:bg-green-900/20 p-4 mb-4"
       data-controller="flash"
       data-action="animationend->flash#remove">
    <p class="text-sm font-medium text-green-800 dark:text-green-300">
      <%= notice %>
    </p>
  </div>
<% end %>
```

### 6.2 Error Handling Patterns

**Pundit Authorization Errors**:

```ruby
# In ApplicationController
rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

def user_not_authorized
  flash[:alert] = t("errors.unauthorized")
  redirect_to(request.referrer || dashboard_path)
end
```

**Service Error Handling**:

```ruby
result = MyService.new.call(params)
if result.success?
  redirect_to path, notice: result.message
else
  flash[:alert] = result.message
  render :new
end
```

**Form Errors**:

- Use `shared/_form_errors` partial to display model validation errors
- Display errors at the top of forms

### 6.3 Error Partials

Create reusable error partials for consistent error display:

- `shared/_form_errors.html.erb` - Form validation errors
- `shared/_flash_messages.html.erb` - Flash messages

## 7. Development Standards

- **Authentication**: Use Devise. Customize layouts in `ApplicationController#layout_by_resource`.
- **Pagination**: Use Pagy (configured in `config/initializers/pagy.rb`).
- **Naming**: Follow standard Rails naming conventions (PascalCase for classes, snake_case for methods and variables).
- **Slim Controllers**: Controllers should only handle request/response flow, session management, and delegating to services/models.
- **Code Quality**: Use RuboCop (Omakase style), Brakeman for security, bundler-audit for dependencies.

## 8. Prompting Strategy for AI

When asking an AI to generate code for this project, use this template:

> "Implement [feature] following the project's standards:
>
> 1. Use a Service Object for business logic with `ServiceResult`.
> 2. Use Pundit for authorization.
> 3. Use Draper for view logic.
> 4. Ensure full i18n support in French and English.
> 5. Use Tailwind CSS with dark mode variants for all UI elements:
>    - **Ask the user what color scheme they want** before applying colors to new components
>    - Use `theme-green` for primary actions and brand elements (unless user specifies otherwise)
>    - Always include dark mode classes (e.g., `bg-white dark:bg-gray-800`)
>    - **MUST use existing shared partials** from `app/views/shared/` for admin panels:
>      - `shared/dashboard_header` for page headers
>      - `shared/pagination` for pagination
>      - `shared/empty_state` for empty states
>      - `shared/button` for buttons
>      - `shared/badge` for status badges
>      - `shared/form_field` for form inputs
>      - `shared/form_errors` for validation errors
>    - Follow DRY principles - extract repeated patterns into partials
>    - Follow the color patterns from `_button.html.erb` and `_badge.html.erb`
> 6. Model patterns:
>    - Add validations with appropriate conditions
>    - Use string enums with explicit values
>    - Use `after_commit` for jobs, `before_save` for normalization
>    - Normalize PostgreSQL array fields in callbacks
> 7. Use Stimulus controllers for JavaScript interactivity
> 8. Use ActiveJob for background processing with proper error handling
> 9. Add database indexes for foreign keys and frequently queried columns
> 10. Use flash messages (notice/alert) for user feedback
> 11. Keep the controller slim."

### Tailwind-Specific AI Instructions

When generating UI components, include these Tailwind requirements:

> "Style this component using Tailwind CSS:
>
> - **IMPORTANT**: Ask the user what color scheme they want to use before applying colors
> - Include dark mode variants for all colors, backgrounds, borders, and text
> - Use `theme-green` (#2365b7) for primary actions and focus states (unless user specifies otherwise)
> - Use the slate color scale for neutrals
> - Follow the patterns from existing shared components
> - Ensure proper focus states with `focus:ring-2 focus:ring-offset-2 focus:ring-theme-green`
> - Use consistent spacing from Tailwind's scale
> - Don't assume colors - always ask for user preference when creating new components"
