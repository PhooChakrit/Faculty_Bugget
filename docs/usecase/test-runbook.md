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
  -d '{"toStatus":"STATUS_0","userId":"'$LEADER_ID'","actorRole":"USER"}'
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
- Set `docLink` via `PUT /api/projects/{id}`, then retry STATUS_10 and expect 200.
- Expect STATUS_10 to be the final ended state.

## 6. Terminal STATUS_10 Check

- Attempt any transition out of STATUS_10.
- Expect 400 with no available transitions.

## 7. Post-End Immutability

- Attempt PUT /api/projects/{id} after STATUS_10.
- Expect 409 and ended-project error message.

## 8. Recall

### 8.1 User requests recall

```bash
curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/recall" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"'$USER_RESEARCH'","reason":"test"}'
```

- Expect pending request from STATUS_1.

### 8.2 Department head reviews recall

- Approve with `POST /api/projects/{id}/recall/review`.
- Expect transition to RECALL only after assigned HoD approval.
- Resume with `RECALL -> STATUS_1` by งานวิจัย.

## 9. Result Table

| Case                     | Expected                                  | Actual | Pass/Fail | Notes |
| ------------------------ | ----------------------------------------- | ------ | --------- | ----- |
| UC-01 DRAFT->STATUS_0    | 200                                       |        |           |       |
| UC-02 STATUS_0->STATUS_1 | 200                                       |        |           |       |
| NG-Role unauthorized     | 403                                       |        |           |       |
| Report gate              | 400/200                                   |        |           |       |
| Terminal STATUS_10       | no outgoing transitions                   |        |           |       |
| Post-end immutable       | 409                                       |        |           |       |
| Recall certified flow    | pending -> approved -> RECALL -> STATUS_1 |        |           |       |
