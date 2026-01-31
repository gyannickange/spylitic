# Product Backlog

## Epics Overview
1. Foundations & Compliance
2. Data Ingestion & Normalization
3. Search, Ranking & Analytics
4. Core UI Framework
5. Dashboard (Home)
6. Ads Library (Meta/TikTok/Pinterest)
7. Trending Shops
8. Products
9. Success Radar
10. Magic Search & Creative Finder
11. Account, Credits & Billing
12. Community & Learning
13. QA, Monitoring & Operations

## Estimation & Priority Scale
- Priority: P0 (must-have), P1 (should-have), P2 (nice-to-have), P3 (later)
- Estimate: S (<=3 days), M (4-8 days), L (9-15 days), XL (16-25 days)

---

## 1) Foundations & Compliance
### EP-001: MVP definition & risk controls
- FEAT-001.1 [P0][S]: Define MVP scope and phased roadmap (modules & limits)
  - AC: Signed-off scope doc; out-of-scope list captured
- FEAT-001.2 [P0][M]: Data source compliance review per platform
  - AC: Written compliance stance and allowed data sources
- FEAT-001.3 [P0][S]: Security baseline (PII, auth, logging)
  - AC: Threat model + security checklist

## 2) Data Ingestion & Normalization
### EP-002: Ingestion pipelines
- FEAT-002.1 [P0][M]: Ingestion scheduler + job queue
  - AC: Jobs can run per source with retries/backoff
- FEAT-002.2 [P0][M]: Normalized schema for ads/products/shops
  - AC: Documented mapping + versioning strategy
- FEAT-002.3 [P1][M]: Media capture (images/videos) storage
  - AC: Media stored with lifecycle policy; URLs stable

## 3) Search, Ranking & Analytics
### EP-003: Search and relevance
- FEAT-003.1 [P0][L]: Full-text search + filters (ads/products/shops)
  - AC: Response < 1s for typical queries
- FEAT-003.2 [P1][M]: Trending scoring + freshness labels
  - AC: Scores updated daily; labels visible in UI
- FEAT-003.3 [P1][M]: Analytics aggregates (views, spend, growth)
  - AC: Aggregates available via API and UI

## 4) Core UI Framework
### EP-004: Frontend foundations
- FEAT-004.1 [P0][M]: Design system + component library
  - AC: Buttons, cards, tables, filters, charts implemented
- FEAT-004.2 [P0][S]: Global layout + navigation
  - AC: Navigation maps to modules with permission gating
- FEAT-004.3 [P0][S]: Auth/guarded routes
  - AC: Locked views show upgrade/registration CTAs

## 5) Dashboard (Home)
### EP-005: Home experience
- FEAT-005.1 [P1][S]: Welcome panel + usage tips
  - AC: Dynamic welcome + links to key actions
- FEAT-005.2 [P1][M]: Top 10 products carousel
  - AC: Date tabs + platform filter + save action
- FEAT-005.3 [P2][S]: Community highlights panel
  - AC: Render featured posts; fallback if none

## 6) Ads Library
### EP-006: Ads library core
- FEAT-006.1 [P0][L]: Multi-source ads list + filters
  - AC: Filters for date, media, CTA, platform
- FEAT-006.2 [P0][M]: Keyword search
  - AC: Search across title, copy, shop name
- FEAT-006.3 [P1][S]: Seasonal category presets
  - AC: Presets apply filter bundles

## 7) Trending Shops
### EP-007: Shops tracking
- FEAT-007.1 [P1][M]: Shops list + metrics table
  - AC: Displays visits, growth, revenue, creation date
- FEAT-007.2 [P1][M]: Shop filters (traffic, country, apps, etc.)
  - AC: Multi-filter + saved views
- FEAT-007.3 [P2][S]: Add shop workflow
  - AC: User can add by URL and see indexing status

## 8) Products
### EP-008: Product discovery
- FEAT-008.1 [P1][M]: Product search + filters
  - AC: Filters by niche, country, ad volume, spend
- FEAT-008.2 [P1][M]: Product detail view
  - AC: Ads history, shops selling, engagement chart
- FEAT-008.3 [P1][S]: Paywalled analytics
  - AC: Premium-only metrics gated

## 9) Success Radar
### EP-009: Early detection
- FEAT-009.1 [P2][M]: Top 100 products leaderboard
  - AC: Refresh multiple times per day
- FEAT-009.2 [P2][M]: Early growth scoring
  - AC: Score formula documented and visible
- FEAT-009.3 [P2][M]: Historical trends view
  - AC: Time series for ads + sales proxies

## 10) Magic Search & Creative Finder
### EP-010: Creative intelligence
- FEAT-010.1 [P2][M]: Image/keyword search
  - AC: Upload + similarity results
- FEAT-010.2 [P2][M]: Reverse image lookup
  - AC: Results include suppliers/shops when possible
- FEAT-010.3 [P2][M]: Creative finder (all assets per product)
  - AC: Deduplicated asset list with performance hints

## 11) Account, Credits & Billing
### EP-011: Account system
- FEAT-011.1 [P0][S]: Register/login flows
  - AC: Email auth + password reset
- FEAT-011.2 [P1][M]: Credits + daily streaks
  - AC: Streak counter + usage ledger
- FEAT-011.3 [P1][M]: Subscription & upgrade
  - AC: Plan management + billing portal

## 12) Community & Learning
### EP-012: Learning and community
- FEAT-012.1 [P3][M]: Academy content hub
  - AC: Course list + progress tracking
- FEAT-012.2 [P3][M]: Coaching/Club modules
  - AC: Access gated by plan
- FEAT-012.3 [P3][S]: Partner deals page
  - AC: List of partner offers with CTA tracking

## 13) QA, Monitoring & Operations
### EP-013: Quality & reliability
- FEAT-013.1 [P0][M]: Automated tests (API + UI)
  - AC: CI runs on PR with coverage thresholds
- FEAT-013.2 [P0][M]: Data quality checks
  - AC: Alerts for stale data/ingestion gaps
- FEAT-013.3 [P0][S]: Monitoring & alerting
  - AC: Dashboards for latency, errors, throughput

---

## Suggested Milestones
- M1 (4–6 weeks): Foundations, core UI, Ads Library MVP
- M2 (4–6 weeks): Trending Shops + Products MVP
- M3 (4–6 weeks): Success Radar + Creative tools + Billing
