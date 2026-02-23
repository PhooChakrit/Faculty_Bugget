export interface Collaborator {
  id: number;
  name: string;
}

export interface Manager {
  id: number;
  name: string;
  position: string;
}

export interface IncomeItem {
  id: number;
  name: string;
  amount: string;
}

export interface Participant {
  id: number;
  count: string;
  details: string;
}

export interface FormData {
  receiptNumber: string;
  projectNameThai: string;
  projectNameEng: string;
  leaderName: string;
  leaderPosition: string;
  department: string;
  leaderEmail: string;
  coLeaderName: string;
  coLeaderEmail: string;
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
  participants: Participant[];
  venue: string;
  committee: string;
  expectedBenefits: string;
  projectEvaluation: string;
  budgetSourceExtGov: string;
  budgetSourceExtPrivate: string;
  budgetSourceExtForeign: string;
  budgetSourceInternal: string;
  incomeSupportItems: IncomeItem[];
  incomeRegistrationItems: IncomeItem[];
  expenseRemuneration: string;
  expenseSupplies: string;
  expenseMaterials: string;
  expenseUtilities: string;
  expenseSubsidy: string;
  expenseReserve: string;
}

export interface Notes {
  note2: boolean;
  note3: boolean;
}
