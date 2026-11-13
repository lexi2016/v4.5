# V4.5 P0 execution ledger

Plan: IMPLEMENTATION_BRIEF.md and user-authorized Drive implementation prompt (2026-11-13).
Original baseline: `530beea8f3c3edd082d777cbe316b4b0322080ee`.
Inherited branch head: `9f813e8e6a60e20c38d0594d5fd92aa7ac49261c`.

## Scope and decisions

- One writer; parallel read-only source/data investigations; one final independent reviewer.
- Reuse the eight existing implementation commits. Do not restart or overwrite their work.
- Candidate frontend is derived from the frozen API role. Complete its actual import closure; do not change SHA overlays or role matrices.
- Only new V4.5 pages, necessary API-role frontend dependencies/static type repairs, tests and small handoff tools/docs may change. No producer, API business logic, strategy, ranking or gates change.
- Ruling: keep frozen formula comparisons as explicitly historical reference, never as a live pool or a current-input match without fingerprint evidence.
- Ruling: a failed independent evidence endpoint retains valid sibling evidence; identity conflicts are isolated and visibly recorded.
- Ruling: preserve existing incompatible tests and report them. Do not remove tests or manufacture private Mac fixture data to green the suite.

## Evidence so far

- Supplied ZIP: 274318 bytes; SHA256 `21fe95c541eac216dfbc2b9b4dee94ede1e9a4756e50ebf15a150e962f5be11a`; 23/23 listed members verified.
- Original 426-row CSV: 116835 bytes; SHA256 `79af9b579c3c88cffe9a7017d4d1d17f136b7065a7b899f21e0a97f7eb41926d` verified; no re-upload.
- Inherited HEAD full frontend suite: 18 failed files / 28 passed / 1 skipped; 39 failed tests / 468 passed / 2 skipped. Typecheck failed including missing API-role imports.
- New behavior regressions reproduced RED before data adapter changes (zero denominator, source dates, pagination revision, partial reads, evidence isolation, maturity).

## Completed implementation and verification

1. Exact API candidate: 52 additional files aligned; 136/138 API web files match frozen bytes. Only index script and three MPA inputs differ intentionally.
2. All three pages implemented with date/source/stock links; data reads preserve independent valid evidence, original maturity and unavailable states.
3. Real-data full-pool tests, actual main.js DOM interactions, syntax, build and six static HTTP entries verified. Desktop/638px browser rendering NOT_RUN because the cloud browser could not connect to isolated loopback. No screenshot PASS claimed.
4. One fresh independent review: REQUEST_CHANGES, 0 Critical / 3 Important. All three reproduced RED and fixed GREEN by the only Writer; no second review represented as approval.
5. Final targeted checks: 33/33 PASS. Full retained suite: 615 PASS / 74 FAIL / 2 SKIP. API baseline's 538 assertion states exactly match; 15 additional failures belong to seven non-API residual test files. Typecheck: 36 FAIL diagnostics, including all original API 31 plus five non-API test errors. Build: PASS, 125 modules.
6. Frozen sources: all 3053 references / 1746 unique Git-tree files verified. Runtime candidate, baseline, replay and production identities remain separate.
7. Pre-push remote advanced to `5440a4c1eb836e3761fb349dc407768582b97658` with only the isolated audit-input workflow. Preserved it byte-for-byte and rebased the unpublished local implementation commit; runtime bytes unchanged. No force push or main-branch merge.

Implementation/report commits are pushed to the already-authorized work branch only; exact remote commit and key-byte readback are reported after the Git operation. This ledger does not infer a push from a local commit.

Deployment, production API/UI and natural-run acceptance: NOT_RUN.
RESEARCH_ONLY=true; production_allowed=false; buy_gate_updated=false; orders_sent=false.
