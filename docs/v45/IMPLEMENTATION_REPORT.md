# V4.5 P0 implementation report

- Branch: `codex/v45-parallel-p0-20261113`
- Base: `530beea8f3c3edd082d777cbe316b4b0322080ee`
- Scope: additive V4.5 MPA pages; existing V4 navigation and behavior retained.
- Safety: `RESEARCH_ONLY=true`, `production_allowed=false`, `buy_gate_updated=false`, `orders_sent=false`.

## Additive entry points

- `/v45/selection/`: reads the existing `/api/v4/preselection-pools` with bounded 300-row pagination; validates exact date and offset chain; deduplicates by market-qualified security identity while preserving source membership, source date, rank, score, status and SHA. Formula comparison uses frozen A-share summary counts only. HK formula comparison is intentionally not inferred.
- `/v45/research/`: A-share reads the existing daily-product, original-chart, company-materials and event-cases endpoints. HK reads the existing HK_CONNECT manager workbench research endpoint (slot 1530). It separates material readiness from import/readiness and never writes.
- `/v45/review/`: reads the exact-date `/api/v3/review` envelope, shows A/HK separately, and reads A-share D+2/D+5 event-case maturity on explicit user-selected source date. HK maturity remains CANNOT_CONFIRM if no exact HK security-level field is supplied.

## Source/data decisions

- The API-role App.vue is extended only by appending three anchors immediately after the existing Vibe 8910 anchor. All old navigation entries remain unchanged.
- Vite gains three MPA inputs; existing inputs remain.
- The real 2026-11-13 Drive delta ZIP was SHA-256 verified locally. Raw candidate CSVs and large API responses are not committed. Only frozen formula aggregate counts and contract-level tests are represented in code.
- 2026-11-12 historical Futu 426/426 is labeled historical; 2026-11-13 Futu remains CANNOT_CONFIRM_NOT_QUERIED.
- Stage7 missing/partial is shown as an independent source state; it does not suppress other source pools.
- No HK v1.9.2 comparison is invented.

## Tests

- Node built-in tests cover market-qualified identity, multi-page deduplication, source membership preservation, optional Stage7 isolation, pagination gaps, exact date validation and frozen formula comparison.
- The GitHub Actions workflow runs these tests plus existing web Vitest, Vue typecheck and Vite build.

## Deployment and production

No merge, production deployment, service/task restart, Futu write, Drive write, model/strategy change, BUY-gate change or order submission is included. API/UI deployment and natural-run certification remain NOT_RUN.
