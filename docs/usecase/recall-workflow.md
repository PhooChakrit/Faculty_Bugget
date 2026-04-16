# Recall Workflow Use Cases

Implemented model: User requests recall, then department head certifies before project enters RECALL.

## Endpoints

- POST /api/projects/{id}/recall
- POST /api/projects/{id}/recall/review
- POST /api/projects/{id}/status/transition (for RECALL -> STATUS_1)

## Recall Use Cases

### RC-01 User Submits Recall Request

- Precondition: project.currentStatusCode = STATUS_1
- Actor: project owner/requester
- Request body example:

```json
{
  "userId": "<requester-id>",
  "reason": "ต้องการแก้ไขรายละเอียดเอกสาร"
}
```

- Expected:
- HTTP 200/201
- recall request status = PENDING_DEPT_HEAD_APPROVAL
- project remains STATUS_1

### RC-02 Department Head Approves Recall Request

- Precondition: pending recall request exists
- Actor role: ภาควิชา
- Request body example:

```json
{
  "reviewerId": "<dept-head-id>",
  "decision": "APPROVE",
  "note": "อนุมัติให้เรียกคืน"
}
```

- Expected:
- HTTP 200
- project transitions STATUS_1 -> RECALL
- request status = APPROVED

### RC-03 Department Head Rejects Recall Request

- Precondition: pending recall request exists
- Actor role: ภาควิชา
- Decision: REJECT
- Expected:
- HTTP 200
- project stays STATUS_1
- request status = REJECTED

### RC-04 Research Resumes Workflow

- Precondition: project.currentStatusCode = RECALL
- Actor role: งานวิจัย
- Transition: RECALL -> STATUS_1
- Expected: HTTP 200

## Negative Cases

### RC-NG-01 Request Recall Outside STATUS_1

- Expected: HTTP 400

### RC-NG-02 Non-Department Role Attempts Review

- Expected: HTTP 403

### RC-NG-03 Duplicate Open Recall Request

- Expected: HTTP 409
