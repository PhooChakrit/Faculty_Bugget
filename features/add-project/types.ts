export interface Collaborator {
  id: number;
  name: string;
}

export interface Manager {
  id: number;
  name: string;
  position: string;
}

export interface FormData {
  receiptNumber: string;
  projectNameThai: string;
  projectNameEng: string;
  leaderName: string;
  leaderPosition: string;
  department: string;
  leaderEmail: string;
  startDate: string;
  endDate: string;
  background: string;
  projectDetails: string;
  objectives: string;
  scope: string;
  implementationPlan: string;
  serviceType: string;
  targetGroups: string[];
  strategies: string[];
  participantCount: string;
  venue: string;
  committee: string;
  expectedBenefits: string;
  budgetSourceExtGov: string;
  budgetSourceExtPrivate: string;
  budgetSourceExtForeign: string;
  budgetSourceInternal: string;
}

export interface Notes {
  note1: boolean;
  note2: boolean;
  note3: boolean;
  note4: boolean;
}
