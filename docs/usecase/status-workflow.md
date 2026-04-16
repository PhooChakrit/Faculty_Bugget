# Status Workflow Use Cases

Scope: Current workflow with STATUS_0 gate enabled.

## Actor Roles

- ภาควิชา
- งานวิจัย
- งานแผน
- งานคลัง
- กายภาพ

## Endpoints Used

- POST /api/projects
- PUT /api/projects/{id}
- POST /api/projects/{id}/status/transition
- GET /api/projects/{id}/status

## Use Cases

### UC-00 Create Draft Project

- Precondition: leaderId exists in User table.
- Request:

```json
{
  "draft": true,
  "leaderId": "<leader-id>"
}
```

- Endpoint: POST /api/projects
- Expected:
- HTTP 201
- project.currentStatusCode = DRAFT

### UC-01 Submit Draft to Department-Head Gate

- Precondition: project.currentStatusCode = DRAFT
- Request:

```json
{
  "toStatus": "STATUS_0",
  "userId": "<actor-id>",
  "actorRole": "ภาควิชา"
}
```

- Endpoint: POST /api/projects/{id}/status/transition
- Expected:
- HTTP 200
- currentStatusCode = STATUS_0

### UC-02 Department-Head Approves to Research Review

- Precondition: project.currentStatusCode = STATUS_0
- Request:

```json
{
  "toStatus": "STATUS_1",
  "userId": "<actor-id>",
  "actorRole": "ภาควิชา"
}
```

- Endpoint: POST /api/projects/{id}/status/transition
- Expected:
- HTTP 200
- currentStatusCode = STATUS_1
- projectCode generated once if null

### UC-03 Research Marks Initial Review Complete

- Precondition: STATUS_1
- Request:

```json
{
  "toStatus": "STATUS_2",
  "userId": "<actor-id>",
  "actorRole": "งานวิจัย"
}
```

- Expected: HTTP 200, state = STATUS_2

### UC-04 Send Back for Correction

- Precondition: STATUS_2
- Request to STATUS_1 by งานวิจัย
- Expected: HTTP 200, state = STATUS_1

### UC-05 Forward to Committee

- Precondition: STATUS_2
- Request to STATUS_3 by งานวิจัย
- Expected: HTTP 200, state = STATUS_3

### UC-06 Committee Branch A

- Transition: STATUS_3 -> STATUS_4
- Allowed role: งานวิจัย

### UC-07 Committee Branch B

- Transition: STATUS_3 -> STATUS_5
- Allowed role: งานวิจัย

### UC-08 Branch A Dean Pipeline

- Transition chain: STATUS_4 -> STATUS_6 -> STATUS_8
- Allowed role: งานวิจัย

### UC-09 Branch B Dean Pipeline

- Transition chain: STATUS_5 -> STATUS_7 -> STATUS_9
- Allowed role: งานวิจัย

### UC-10 Report Submission Trigger

- Precondition: STATUS_8 or STATUS_9
- Required: project.docLink is non-empty
- Transition: -> STATUS_10
- Allowed role: งานวิจัย
- Expected: HTTP 200 and close-checklist rows initialized

### UC-11 Close Project

- Precondition: STATUS_10 and RESEARCH+PHYSICAL complete
- Transition: STATUS_10 -> STATUS_13
- Allowed roles: งานวิจัย or กายภาพ
- Expected: HTTP 200

### UC-12 Suspend Project

- Precondition: STATUS_10
- Transition: STATUS_10 -> STATUS_14
- Allowed role: งานวิจัย

### UC-13 Exception Status

- Transition: STATUS_1 -> STATUS_15 or STATUS_2 -> STATUS_15
- Allowed role: งานวิจัย

### UC-14 Resume from Recall

- Transition: RECALL -> STATUS_1
- Allowed role: งานวิจัย

### UC-15 Legacy Compatibility

- STATUS_11 -> STATUS_13/14
- STATUS_12 -> STATUS_13/14

## Negative Cases

### NG-01 Unauthorized Role

- Any transition with wrong role
- Expected: HTTP 403

### NG-02 Invalid Edge

- Transition not in allowed map
- Expected: HTTP 400 + availableTransitions

### NG-03 Missing Report Link

- STATUS_8/9 -> STATUS_10 without docLink
- Expected: HTTP 400

### NG-04 Close Before Checklist Complete

- STATUS_10 -> STATUS_13 when RESEARCH/PHYSICAL incomplete
- Expected: HTTP 400

### NG-05 Closed Project Immutable

- PUT /api/projects/{id} after STATUS_13
- Expected: HTTP 409
