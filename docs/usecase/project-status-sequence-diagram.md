# Project Status Workflow Sequence Diagrams

Source alignment:

- `docs/usecase/status-workflow.md`
- `docs/usecase/recall-workflow.md`
- `prisma/schema.prisma`
- `app/api/projects/[id]/status/transition/route.ts`
- `lib/status-service.ts`
- `app/api/overviews/route.ts`

Canonical state path:

`DRAFT -> STATUS_0 -> STATUS_1 -> STATUS_2 -> ... -> STATUS_10`

`RECALL` is a side state from `STATUS_1`. `STATUS_10` is terminal.

## 1) Main Happy Path

```mermaid
sequenceDiagram
    autonumber
    participant User as USER
    participant Research as งานวิจัย
    participant HoD as ภาควิชา (Assigned HoD)
    participant API as Project API
    participant DB as Database

    Note over User,DB: If actorRole is missing/blank, API treats actor as USER

    Research->>API: POST /api/departments/head-assignment
    API->>DB: Upsert department -> headUserId
    API-->>Research: HoD assignment saved

    User->>API: POST /api/projects or PUT /api/projects/{id}
    API->>DB: Save project data with selected department
    API->>DB: Create/update project as DRAFT
    API-->>User: Project saved (currentStatusCode = DRAFT)

    User->>API: POST /api/projects/{id}/status/transition { toStatus: STATUS_0, actorRole: USER }
    API->>DB: Validate selected department has HoD assignment
    API->>DB: Create STATUS_0 status record
    API->>DB: Update currentStatusCode = STATUS_0
    API-->>User: Draft submitted to HoD queue

    HoD->>API: POST /api/projects/{id}/status/transition { toStatus: STATUS_1, actorRole: ภาควิชา }
    API->>DB: Validate userId is assigned HoD for project.department
    API->>DB: Generate projectCode once if missing
    API->>DB: Create STATUS_1 status record
    API->>DB: Update currentStatusCode = STATUS_1
    API-->>HoD: Approved and sent to งานวิจัย

    Research->>API: POST status transitions STATUS_1 -> ... -> STATUS_8/9
    API->>DB: Apply allowed transitions from status constants
    API-->>Research: Project reaches approved execution state

    Research->>API: POST transition { STATUS_8/9 -> STATUS_10 }
    API->>DB: Require non-empty docLink
    API->>DB: Create terminal STATUS_10 status record
    API->>DB: Update currentStatusCode = STATUS_10
    API-->>Research: Project ended

    User->>API: POST /api/projects/{id}/summary/submit
    API->>DB: Record summary submission
    API-->>User: Summary accepted, currentStatusCode remains STATUS_10
```

## 2) HoD Assignment

```mermaid
sequenceDiagram
    autonumber
    participant Research as งานวิจัย
    participant API as Department API
    participant DB as Database

    Research->>API: GET /api/departments/head-assignment?department=<name>
    API->>DB: Lookup DepartmentHeadAssignment by department
    API-->>Research: Existing assignment or null

    Research->>API: POST /api/departments/head-assignment { department, headUserId, actorRole: งานวิจัย }
    API->>DB: Validate actorRole is งานวิจัย
    API->>DB: Validate headUserId and actorUserId exist
    API->>DB: Upsert DepartmentHeadAssignment
    API-->>Research: Assignment ready for draft submit and HoD approval
```

## 3) Alternative Cases

```mermaid
sequenceDiagram
    autonumber
    participant User as USER
    participant Research as งานวิจัย
    participant HoD as ภาควิชา (Assigned HoD)
    participant API as Project/Recall API
    participant DB as Database

    alt Missing HoD assignment for selected department
        User->>API: POST transition { DRAFT -> STATUS_0 }
        API->>DB: Lookup department -> HoD assignment
        API-->>User: 400 Missing HoD assignment
    end

    alt Non-assigned HoD tries to approve
        User->>API: POST transition { DRAFT -> STATUS_0 }
        API->>DB: Update currentStatusCode = STATUS_0
        HoD->>API: POST transition { STATUS_0 -> STATUS_1 }
        API->>DB: Compare reviewer userId with assigned headUserId
        API-->>HoD: 403 Not assigned HoD
    end

    alt Recall flow from STATUS_1
        User->>API: POST /api/projects/{id}/recall
        API->>DB: Create DEPT_HEAD recall request on current STATUS_1 record
        API-->>User: Pending HoD certification

        alt HoD approves recall
            HoD->>API: POST /api/projects/{id}/recall/review { decision: APPROVE }
            API->>DB: Validate assigned HoD
            API->>DB: Mark recall request approved
            API->>DB: Transition STATUS_1 -> RECALL
            API-->>HoD: Recall approved
            Research->>API: POST transition { RECALL -> STATUS_1 }
            API->>DB: Resume workflow at STATUS_1
            API-->>Research: Project resumed
        else HoD rejects recall
            HoD->>API: POST /api/projects/{id}/recall/review { decision: REJECT }
            API->>DB: Mark recall request rejected
            API->>DB: Keep currentStatusCode = STATUS_1
            API-->>User: Recall rejected
        end
    end

    alt Transition requested after STATUS_10
        Research->>API: POST status transition from STATUS_10
        API->>DB: Lookup available transitions
        API-->>Research: 400 Invalid transition, availableTransitions = []
    end
```

## 4) Complete Active Project State Diagram

```mermaid
flowchart TD
    D[DRAFT<br/>Editable draft]
    S0[STATUS_0<br/>Waiting assigned HoD approval]
    S1[STATUS_1<br/>Research review / correction]
    S2[STATUS_2<br/>Research review complete]
    S3[STATUS_3<br/>Submitted to faculty committee]
    S4[STATUS_4<br/>Committee approved]
    S5[STATUS_5<br/>Committee endorsed]
    S6[STATUS_6<br/>Submitted to dean]
    S7[STATUS_7<br/>Submitted to dean meeting]
    S8[STATUS_8<br/>Dean approved]
    S9[STATUS_9<br/>Dean meeting approved]
    S10[STATUS_10<br/>Ended / terminal]
    RECALL[RECALL<br/>Document recalled]

    D -->|USER submits; HoD assignment required| S0
    S0 -->|Assigned HoD approves; generate projectCode if null| S1

    S1 -->|Research review complete| S2
    S1 -->|Recall certified by HoD| RECALL
    RECALL -->|Research resumes| S1

    S2 -->|Send back for correction| S1
    S2 -->|Forward to committee| S3

    S3 -->|Approval branch| S4
    S3 -->|Endorsement branch| S5
    S4 --> S6 --> S8
    S5 --> S7 --> S9
    S8 -->|docLink required| S10
    S9 -->|docLink required| S10
```

## 5) Implementation Alignment Notes

- Status changes should go through `POST /api/projects/{id}/status/transition`.
- `GET /api/overviews` displays current status labels but should not define canonical transition rules.
- Inline overview status editing is legacy behavior and should not be treated as the source of truth for the workflow.
- Formal `projectCode` generation belongs to HoD approval into `STATUS_1`.
- `STATUS_10` is final; new projects do not use `STATUS_11`, `STATUS_12`, `STATUS_13`, `STATUS_14`, or `STATUS_15`.
