# Test Results - 2026-04-16

Environment:

- App: Next.js dev server at http://localhost:3000
- DB: PostgreSQL via Docker (localhost:5433)
- User used for tests: cmmkizw0a0000he4llbgzs8pb
- Project used for transition tests: 6900005
- Additional project used for fix verification: 53daf64a-1a30-4eef-9f9d-c496ef9b64ef

## Migration/Setup

1. `npx prisma migrate status` initially failed due DB not reachable.
2. After Docker DB start, pending migrations found and applied:

- 20260408120000_add_status_0_draft
- 20260416133000_add_status_0_department_head_gate

## Executed Cases

| Case                                           | Expected      | Actual                                                             | Result |
| ---------------------------------------------- | ------------- | ------------------------------------------------------------------ | ------ |
| UC-01 DRAFT -> STATUS_0 (actorRole=ภาควิชา)    | 200           | success true, statusCode STATUS_0                                  | PASS   |
| UC-02 STATUS_0 -> STATUS_1 (actorRole=ภาควิชา) | 200           | success true, statusCode STATUS_1                                  | PASS   |
| NG-Role STATUS_1 -> STATUS_2 by ภาควิชา        | 403           | error ไม่มีสิทธิ์เปลี่ยนสถานะ                                      | PASS   |
| UC-03..UC-08 Branch A to STATUS_8              | 200 each step | STATUS_1->2->3->4->6->8 all success                                | PASS   |
| UC-10 Report gate negative                     | 400           | blocked with docLink required message                              | PASS   |
| UC-10 Report gate positive                     | 200           | success true, statusCode STATUS_10 (after docLink prepared)        | PASS   |
| UC-11 Close guard negative                     | 400           | blocked until RESEARCH+PHYSICAL complete                           | PASS   |
| UC-11 Close guard positive                     | 200           | success true, statusCode STATUS_13                                 | PASS   |
| UC-22 Post-close immutability                  | 409 semantics | API returned success:false with error message (closed cannot edit) | PASS   |
| FIX-01 Draft create ID collision               | no duplicate  | new draft created with UUID id                                     | PASS   |
| FIX-02 PUT supports docLink                    | update works  | docLink persisted via PUT /api/projects/{id}                       | PASS   |
| FIX-03 Direct RECALL without certification     | blocked       | error ต้องผ่านการรับรองคำขอเรียกคืนจากหัวหน้าภาคก่อน            | PASS   |
| FIX-04 Recall request step                     | pending       | /recall returned success + requestId                               | PASS   |
| FIX-05 Department review approve               | transition    | /recall/review APPROVE moved STATUS_1 -> RECALL                    | PASS   |
| RC resume RECALL -> STATUS_1 by งานวิจัย       | 200           | success true, statusCode STATUS_1                                  | PASS   |

## Findings

1. STATUS_0 gate works after applying migrations.
2. Recall now requires department-head certification before entering RECALL.
3. Draft create now uses UUID ids and no longer collides with sequence-style IDs.
4. `docLink` is now updatable via `PUT /api/projects/{id}` and can be used for report-gate tests without DB workaround.
5. Project update endpoint reports closed-state errors as `success:false` payload in this observed test path.

## Not Yet Executed in this run

1. Full Branch B flow (STATUS_3 -> STATUS_5 -> STATUS_7 -> STATUS_9)
2. STATUS_10 -> STATUS_14 suspend path
3. Legacy paths STATUS_11/12 -> STATUS_13/14

## Recommended Next Test Batch

1. Execute Branch B end-to-end to STATUS_9 and re-check report gate from STATUS_9.
2. Add API contract test for closed-edit behavior to enforce HTTP status code policy (409 vs success:false payload).
3. Add negative tests for recall review (non-dept role reject, duplicate pending request).
