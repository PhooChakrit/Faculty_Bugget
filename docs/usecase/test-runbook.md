# Test Runbook: Status and Recall Workflow

This runbook executes API scenarios manually because the repository has no automated API test script.

## 1. Environment Setup

1. Ensure database is running and migrations are applied.
2. Start app:

```bash
npm run dev
```

3. Verify user list and create test user if needed:

```bash
npx tsx scripts/check-users.ts
```

4. Prepare values:

- BASE_URL=http://localhost:3000
- LEADER_ID=<existing user id>
- USER_DEPT=<existing user id>
- USER_RESEARCH=<existing user id>
- PROJECT_ID=<created during run>

## 2. Create Draft

```bash
curl -s -X POST "$BASE_URL/api/projects" \
  -H 'Content-Type: application/json' \
  -d '{"draft":true,"leaderId":"'$LEADER_ID'"}'
```

- Save response id as PROJECT_ID.
- Expect currentStatusCode DRAFT.

## 3. STATUS_0 Gate Flow

### 3.1 DRAFT -> STATUS_0

```bash
curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/status/transition" \
  -H 'Content-Type: application/json' \
  -d '{"toStatus":"STATUS_0","userId":"'$USER_DEPT'","actorRole":"ภาควิชา"}'
```

### 3.2 STATUS_0 -> STATUS_1

```bash
curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/status/transition" \
  -H 'Content-Type: application/json' \
  -d '{"toStatus":"STATUS_1","userId":"'$USER_DEPT'","actorRole":"ภาควิชา"}'
```

- Expect 200 on both.
- Validate status via GET /api/projects/{id}/status.

## 4. Negative Role Check

```bash
curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/status/transition" \
  -H 'Content-Type: application/json' \
  -d '{"toStatus":"STATUS_2","userId":"'$USER_DEPT'","actorRole":"ภาควิชา"}'
```

- Expect 403 (wrong role for this edge).

## 5. Report Gate Check (STATUS_8/9 -> STATUS_10)

- Move project through valid path to STATUS_8 or STATUS_9.
- Attempt STATUS_10 without docLink: expect 400.
- Note: current `PUT /api/projects/{id}` schema does not expose `docLink`; use available admin/data path to set `docLink` for positive test, then retry STATUS_10 and expect 200.

## 6. Close Gate Check

- Attempt STATUS_10 -> STATUS_13 before checklist complete: expect 400.
- Complete role checks (RESEARCH + PHYSICAL), then retry: expect 200.

## 7. Post-Close Immutability

- Attempt PUT /api/projects/{id} after STATUS_13.
- Expect edit to be blocked. Current implementation may return a `success:false` payload with closed-project error message.

## 8. Recall (Current vs Target)

### Current endpoint behavior (implemented)

```bash
curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/recall" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"'$USER_RESEARCH'","reason":"test"}'
```

- Works directly from STATUS_1.

### Target behavior (not yet implemented)

- user request -> pending
- department-head review -> approve/reject
- only on approve transition to RECALL

## 9. Result Table

| Case                     | Expected                                    | Actual | Pass/Fail | Notes |
| ------------------------ | ------------------------------------------- | ------ | --------- | ----- |
| UC-01 DRAFT->STATUS_0    | 200                                         |        |           |       |
| UC-02 STATUS_0->STATUS_1 | 200                                         |        |           |       |
| NG-Role unauthorized     | 403                                         |        |           |       |
| Report gate              | 400/200                                     |        |           |       |
| Close gate               | 400/200                                     |        |           |       |
| Post-close immutable     | blocked (status/payload per implementation) |        |           |       |
| Recall current endpoint  | 200/400 by precondition                     |        |           |       |
