export type ConditionId = "umm" | "hmm" | "control" | string;

export interface ExperimentCondition {
  id: ConditionId;
  label: string;
  loadingText: string;
}

export interface StatementItem {
  id: string;
  text: string;
  groundTruth: boolean;
}

export interface LikertOption {
  value: number;
  label: string;
}

export interface Demographics {
  age: number;
  gender: string;
  education: string;
}

export interface ParticipantSession {
  id: string;
  participantId: string;
  condition: ConditionId;
  age: number;
  gender: string;
  education: string;
  startedAt: string;
  completedAt: string | null;
  totalCompletionTimeMs: number | null;
  statementOrder: string[];
}

export interface TrialResponse {
  id: string;
  participantSessionId: string;
  participantId: string;
  condition: ConditionId;
  trialNumber: number;
  statementId: string;
  statementText: string;
  groundTruth: boolean;
  confidenceRating: number;
  statementAppearedAt: string;
  submittedAt: string;
  responseTimeMs: number;
}

export interface AdminData {
  participants: ParticipantSession[];
  responses: TrialResponse[];
}
