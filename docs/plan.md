# Build Plan

## 1) Scope & Constraints
- Clarify MVP scope vs. later phases (Ads, Trending Shops, Products, Success Radar, Magic Search, Creative Finder).
- Define target users and success metrics (activation, retention, paid conversion).
- Confirm data sources and legal/compliance constraints for each platform.

## 2) Architecture & Data Model
- Define core domains: User, Plan/Credits, Ads, Products, Shops, Creatives, Search Queries, Saved Lists.
- Choose ingestion approach per platform (APIs, partnerships, compliant scraping where allowed).
- Define storage strategy: relational DB + search index + media storage.

## 3) UX & Flows
- Design primary flows: onboarding, dashboard, ads discovery, shop tracking, product detail, saved lists.
- Map filters, facets, and sorting for each module.
- Define upgrade paths: paywall, credits usage, and streak/gamification UI.

## 4) Backend Milestones
- Build ingestion pipeline: schedulers, queues, extractors, normalization.
- Implement search and analytics services (filters, ranking, trending scoring).
- Implement auth, plans, credits, and usage tracking.
- Provide public/private API endpoints and rate limits.

## 5) Frontend Milestones
- Build core UI components: search, filters, cards, tables, charts.
- Implement key screens: Dashboard, Ads, Trending Shops, Products, Success Radar.
- Implement saved lists, onboarding, pricing/upgrade, and account/credits.

## 6) QA, Monitoring, Launch
- Define test plan: unit, integration, data quality, UI regression.
- Add monitoring for ingestion health, data freshness, and search latency.
- Prepare rollout checklist and post-launch feedback loop.
