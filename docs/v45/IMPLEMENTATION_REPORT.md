# V4.5 P0 implementation report

- Branch: `codex/v45-parallel-p0-20261113`
- Base: `530beea8f3c3edd082d777cbe316b4b0322080ee`
- Scope: additive V4.5 MPA pages; exact API-role homepage source and dependencies materialized into editable candidate paths.
- Safety: `RESEARCH_ONLY=true`, `production_allowed=false`, `buy_gate_updated=false`, `orders_sent=false`.

## Additive entry points

- `/v45/selection/`: reads the existing `/api/v4/preselection-pools` with bounded 300-row pagination; validates exact date and offset chain; deduplicates by market-qualified security identity while preserving source membership, source date, rank, score, status and SHA.
- A-share formula comparison: 118 sanitized, frozen row-level comparison records from the two supplied comparison files; preserves original condition fields, v1.9.2 roles/scores, difference reasons and checkpoint SHA. Local checkpoint paths and raw candidate-pool CSVs are excluded. The UI validates row counts/categories against the frozen aggregates. HK is explicitly excluded from A-share formula comparison.
- `/v45/research/`: A-share reads the existing daily-product, original-chart, company-materials and event-cases endpoints. A-share bare codes are converted using the exchange-prefix convention to the existing API symbol form. HK reads the existing HK_CONNECT manager workbench research endpoint (slot 1530). It separates material readiness from import/readiness and never writes.
- `/v45/review/`: reads the exact-date `/api/v3/review` envelope, shows A/HK separately, and reads A-share D+2/D+5 event-case maturity on explicit user-selected source date. HK maturity remains CANNOT_CONFIRM if no exact HK security-level field is supplied.

## Source/data decisions

- The API-role App.vue and its imported view/API/contracts/component dependency variants are copied from the SHA-pinned API role matrix into their normal editable paths. The frozen SHA-named overlays are not edited. API-role App, ResearchView, ReviewView and TaskStatusView dependencies are aligned; role-specific App/Research/Review tests are also materialized.
- The API-role V4 index HTML is used as the Vite entry. A small idempotent DOM adapter appends the three links immediately after the existing Vibe 8910 link. It preserves all legacy navigation items, buttons, URLs and default behavior.
- The adapter tolerates Vue rerenders and does not create a second navigation or route.
- Vite gains three MPA inputs; existing inputs remain.
- The real 2026-11-13 Drive delta ZIP was SHA-256 verified locally. The complete ZIP, raw candidate CSVs and large API responses are not committed. Only the sanitized 118-row formula-comparison fixture and contract tests are included.
- 2026-11-12 historical Futu 426/426 is labeled historical; 2026-11-13 Futu remains CANNOT_CONFIRM_NOT_QUERIED.
- Stage7 missing/partial is shown as an independent source state; it does not suppress other source pools.
- No HK v1.9.2 comparison is invented.

## Tests and review

- Node contract checks cover market-qualified identity, A/HK API symbol mapping, multi-page deduplication, source membership preservation, optional Stage7 isolation, pagination gaps, exact date validation, frozen formula row integrity and nav insertion/idempotency.
- CI runs Node syntax checks, targeted contract checks, existing full web suite, Vue typecheck and Vite build.
- Baseline full web-suite failures are compared against the fixed source baseline; they are reported separately and are not treated as new-feature test passes.
- Separate source review checked exact API-role source mapping, preserved Vibe navigation, no raw pool upload, source/date identity, pagination chain, market separation, failure isolation and read-only behavior.

## Deployment and production

No merge, production deployment, service/task restart, Futu write, Drive write, model/strategy change, BUY-gate change or order submission is included. API/UI deployment and natural-run certification remain NOT_RUN.
