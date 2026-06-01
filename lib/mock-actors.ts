export const actorRoles = [
  "USER",
  "ภาควิชาวิทยาศาสตร์",
  "งานวิจัย",
  "หัวหน้าฝ่ายวิจัย",
  "งานแผน",
  "งานคลัง",
  "กายภาพ",
] as const;

export type ActorRole = (typeof actorRoles)[number];

export interface MockActor {
  role: ActorRole;
  id: string;
  email: string;
  name: string;
}

export const mockActors: MockActor[] = [
  {
    role: "USER",
    id: "mock-user-project-owner",
    email: "mock.project-owner@faculty.local",
    name: "ผู้เสนอโครงการ (Mock)",
  },
  {
    role: "ภาควิชาวิทยาศาสตร์",
    id: "mock-user-department-head",
    email: "mock.department-head@faculty.local",
    name: "หัวหน้าภาควิชาวิทยาศาสตร์ (Mock)",
  },
  {
    role: "งานวิจัย",
    id: "mock-user-research-staff",
    email: "mock.research-staff@faculty.local",
    name: "เจ้าหน้าที่งานวิจัย (Mock)",
  },
  {
    role: "หัวหน้าฝ่ายวิจัย",
    id: "mock-user-research-head",
    email: "mock.research-head@faculty.local",
    name: "หัวหน้าฝ่ายวิจัย (Mock)",
  },
  {
    role: "งานแผน",
    id: "mock-user-planning",
    email: "mock.planning@faculty.local",
    name: "งานแผน (Mock)",
  },
  {
    role: "งานคลัง",
    id: "mock-user-finance",
    email: "mock.finance@faculty.local",
    name: "งานคลัง (Mock)",
  },
  {
    role: "กายภาพ",
    id: "mock-user-physical",
    email: "mock.physical@faculty.local",
    name: "กายภาพ (Mock)",
  },
];

export const mockActorByRole = mockActors.reduce(
  (acc, actor) => {
    acc[actor.role] = actor;
    return acc;
  },
  {} as Record<ActorRole, MockActor>,
);

export function isActorRole(value: string | undefined): value is ActorRole {
  return actorRoles.includes(value as ActorRole);
}
