# Recall Workflow Use Cases

Implemented model: User requests recall, then department head certifies before project enters RECALL.

## Business Rules (Updated)

- If database role is unspecified, requester role is USER.
- HoD reviewer is resolved from department-level HoD assignment managed by งานวิจัย.

## Endpoints

- POST /api/projects/{id}/recall
- POST /api/projects/{id}/recall/review
- POST /api/projects/{id}/status/transition (for RECALL -> STATUS_1)

## Recall Use Cases

### RC-01 User Submits Recall Request

- Precondition: project.currentStatusCode = STATUS_1
- Actor: USER (project owner/requester)
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
- Actor role: ภาควิชา (HoD assigned for project department)
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
- Actor role: ภาควิชา (HoD assigned for project department)
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

### RC-05 STATUS_0 Cannot Recall (Edit Directly)

- Precondition: project.currentStatusCode = STATUS_0
- Actor: project owner/requester
- Behavior:
- Recall endpoint must not create a recall request in STATUS_0
- User can edit project data directly while waiting for department head approval
- Expected:
- HTTP 400 (or business validation error)
- no recall request is created
- project remains STATUS_0

## Negative Cases

### RC-NG-01 Request Recall Outside STATUS_1

- Expected: HTTP 400

### RC-NG-02 Non-Department Role Attempts Review

- Expected: HTTP 403

### RC-NG-03 Duplicate Open Recall Request

- Expected: HTTP 409

### RC-NG-04 Request Recall at STATUS_0

- Context: draft already sent to department head (STATUS_0), but approval not finished
- Expected:
- HTTP 400
- response message indicates recall is only valid from STATUS_1
- user should continue editing directly without recall

### RC-NG-05 No HoD Assignment for Department

- Context: recall request exists but project department has no assigned HoD
- Expected:
- HTTP 400 or 409 (business validation)
- review cannot proceed until งานวิจัย assigns HoD for that department
