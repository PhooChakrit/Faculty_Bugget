# Status Workflow Use Cases

Scope: active new-project workflow with the `STATUS_0` department-head gate enabled.

Canonical state path:

`DRAFT -> STATUS_0 -> STATUS_1 -> STATUS_2 -> ... -> STATUS_10`

`RECALL` is a side state from `STATUS_1`. `STATUS_10` is the final ended state.

## Business Rules

- If `actorRole` is missing or blank, the system treats the actor as `USER`.
- `งานวิจัย` maintains department-level Head of Department (HoD) assignment.
- USER creates or saves a project with a selected department before submission.
- USER submits `DRAFT -> STATUS_0`; the selected department must already have an HoD assignment.
- Assigned HoD approves `STATUS_0 -> STATUS_1`; non-assigned HoD users must be rejected.
- Formal `projectCode` is generated once, when the project enters `STATUS_1` from HoD approval, if it is still missing.
- `งานวิจัย` sees projects from `STATUS_1` through `STATUS_10` plus `RECALL`; `DRAFT` and `STATUS_0` are excluded.
- `STATUS_8/9 -> STATUS_10` requires `docLink`.
- At `STATUS_10`, USER can submit summary without HoD approval and without changing status.
- `STATUS_10` is terminal: no further status transitions are allowed and the project is immutable.
- `STATUS_11`, `STATUS_12`, `STATUS_13`, `STATUS_14`, and `STATUS_15` are not active workflow states for new projects.

## Actor Roles

- `USER` (default when DB role or request role is unspecified)
- `ภาควิชา` (assigned HoD for the project department)
- `งานวิจัย`
- `งานแผน`
- `งานคลัง`
- `กายภาพ`

## Canonical Endpoints

- `GET /api/departments/head-assignment`
- `POST /api/departments/head-assignment`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `GET /api/projects/{id}/status`
- `POST /api/projects/{id}/status/transition`
- `POST /api/projects/{id}/recall`
- `POST /api/projects/{id}/recall/review`
- `POST /api/projects/{id}/summary/submit`
- `GET /api/overviews`

## Use Cases

### UC-00 Manage Department Head Assignment

- Actor: `งานวิจัย`
- Endpoint: `POST /api/departments/head-assignment`
- Request:

```json
{
  "department": "<department-name>",
  "headUserId": "<head-user-id>",
  "actorRole": "งานวิจัย",
  "actorUserId": "<research-user-id>"
}
```

- Expected:
- HTTP 200
- `DepartmentHeadAssignment.department` is created or updated.
- Only `งานวิจัย` can maintain this master data.

### UC-01 Create Or Save Draft Project

- Actor: `USER`
- Precondition: USER exists and selected department is saved on the project before submission.
- Endpoint: `POST /api/projects` or `PUT /api/projects/{id}`
- Expected:
- HTTP 201 for create, or HTTP 200 for update.
- `project.currentStatusCode = DRAFT`
- `project.projectCode` is not required yet.
- Department is available for HoD lookup during submit.

### UC-02 USER Submits Draft To HoD Queue

- Actor: `USER`
- Precondition:
- `project.currentStatusCode = DRAFT`
- `project.department` has a `DepartmentHeadAssignment`
- Endpoint: `POST /api/projects/{id}/status/transition`
- Request:

```json
{
  "toStatus": "STATUS_0",
  "userId": "<user-id>",
  "actorRole": "USER"
}
```

- Expected:
- HTTP 200
- `currentStatusCode = STATUS_0`
- Project waits for assigned HoD approval.
- `projectCode` is still unchanged.

### UC-03 Assigned HoD Approves Draft To Research Review

- Actor: `ภาควิชา`
- Precondition:
- `project.currentStatusCode = STATUS_0`
- `userId` is the assigned HoD for `project.department`
- Endpoint: `POST /api/projects/{id}/status/transition`
- Request:

```json
{
  "toStatus": "STATUS_1",
  "userId": "<assigned-head-user-id>",
  "actorRole": "ภาควิชา"
}
```

- Expected:
- HTTP 200
- `currentStatusCode = STATUS_1`
- `projectCode` is generated once if null.
- Project becomes visible to `งานวิจัย`.

### UC-04 Research Role Sees Active Research Queue

- Actor: `งานวิจัย`
- Endpoint: `GET /api/projects?actorRole=งานวิจัย` or equivalent list endpoint.
- Visibility rule:
- Include `STATUS_1`, `STATUS_2`, ..., `STATUS_10`
- Include `RECALL`
- Exclude `DRAFT` and `STATUS_0`
- Expected:
- HTTP 200
- Returned data contains no draft or HoD-pending projects.

### UC-05 Research Marks Initial Review Complete

- Actor: `งานวิจัย`
- Precondition: `STATUS_1`
- Endpoint: `POST /api/projects/{id}/status/transition`
- Request:

```json
{
  "toStatus": "STATUS_2",
  "userId": "<research-user-id>",
  "actorRole": "งานวิจัย"
}
```

- Expected: HTTP 200, `currentStatusCode = STATUS_2`

### UC-06 Research Sends Project Back For Correction

- Actor: `งานวิจัย`
- Precondition: `STATUS_2`
- Transition: `STATUS_2 -> STATUS_1`
- Expected: HTTP 200, `currentStatusCode = STATUS_1`

### UC-07 Research Forwards To Faculty Committee

- Actor: `งานวิจัย`
- Precondition: `STATUS_2`
- Transition: `STATUS_2 -> STATUS_3`
- Expected: HTTP 200, `currentStatusCode = STATUS_3`

### UC-08 Committee Approval Branch

- Actor: `งานวิจัย`
- Transition chain: `STATUS_3 -> STATUS_4 -> STATUS_6 -> STATUS_8`
- Expected:
- HTTP 200 for each transition.
- Project reaches dean-approved state `STATUS_8`.

### UC-09 Committee Endorsement Branch

- Actor: `งานวิจัย`
- Transition chain: `STATUS_3 -> STATUS_5 -> STATUS_7 -> STATUS_9`
- Expected:
- HTTP 200 for each transition.
- Project reaches dean-meeting-approved state `STATUS_9`.

### UC-10 End Project At STATUS_10

- Actor: `งานวิจัย`
- Precondition:
- `currentStatusCode = STATUS_8` or `STATUS_9`
- `project.docLink` is non-empty.
- Transition: `STATUS_8/9 -> STATUS_10`
- Expected:
- HTTP 200
- `currentStatusCode = STATUS_10`
- Project is ended/final.
- `GET /api/projects/{id}/status` returns no available transitions.

### UC-11 USER Submits Summary At STATUS_10

- Actor: `USER`
- Precondition: `currentStatusCode = STATUS_10`
- Endpoint: `POST /api/projects/{id}/summary/submit`
- Expected:
- HTTP 200
- Summary submission is recorded.
- `currentStatusCode` remains `STATUS_10`.
- No HoD approval is required.

### UC-12 Recall Request And HoD Certification

- Actor sequence: `USER`, then assigned `ภาควิชา`, then `งานวิจัย`
- Precondition: `currentStatusCode = STATUS_1`
- Endpoints:
- `POST /api/projects/{id}/recall`
- `POST /api/projects/{id}/recall/review`
- `POST /api/projects/{id}/status/transition`
- Expected:
- USER creates pending recall request.
- Assigned HoD approves request before project can enter `RECALL`.
- If HoD rejects, project remains `STATUS_1`.
- `งานวิจัย` resumes `RECALL -> STATUS_1`.

## Negative Cases

### NG-01 Missing Role Defaults To USER

- Request omits `actorRole`.
- Expected:
- API treats actor as `USER`.
- USER-only actions may proceed.
- Non-USER actions fail unless the correct role is supplied.

### NG-02 Unauthorized Role

- Any transition is attempted with the wrong role.
- Expected: HTTP 403

### NG-03 Invalid Edge

- Transition is not present in `allowedTransitions`.
- Expected: HTTP 400 with `availableTransitions`

### NG-04 Missing HoD Assignment For Draft Submit

- Context: USER attempts `DRAFT -> STATUS_0` but project department has no assignment.
- Expected: HTTP 400

### NG-05 USER Performs HoD Approval

- Context: USER attempts `STATUS_0 -> STATUS_1`.
- Expected: HTTP 403

### NG-06 Non-Assigned HoD Approves Draft

- Context: actorRole is `ภาควิชา`, but `userId` does not match assigned HoD for the project department.
- Expected: HTTP 403

### NG-07 Missing Report Link

- Context: `STATUS_8/9 -> STATUS_10` without `docLink`.
- Expected: HTTP 400

### NG-08 Transition Out Of STATUS_10

- Context: any status transition is requested while project is already `STATUS_10`.
- Expected:
- HTTP 400 or equivalent validation error.
- `availableTransitions` is empty.

### NG-09 Edit After STATUS_10

- Context: `PUT /api/projects/{id}` after `STATUS_10`.
- Expected: HTTP 409

### NG-10 Recall Without HoD Certification

- Context: direct transition `STATUS_1 -> RECALL` before assigned HoD approves recall request.
- Expected: HTTP 400

### NG-11 Recall Outside STATUS_1

- Context: USER requests recall while project is not `STATUS_1`.
- Expected: HTTP 400

## Implementation Alignment Notes

- Use `POST /api/projects/{id}/status/transition` as the canonical status mutation API.
- `GET /api/overviews` is a read/display endpoint for overview rows and status labels.
- Inline overview field status editing is legacy behavior and should not define the workflow.
- Do not generate `projectCode` at draft creation or draft submit; generate it only when HoD approval moves the project into `STATUS_1`.
- Keep inactive Prisma enum values until a deliberate database migration confirms there are no rows using them.
