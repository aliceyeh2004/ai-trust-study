import { experimentConfig } from "../config/experimentConfig";
import type { AdminData, ParticipantSession, TrialResponse } from "../types/experiment";

export interface DataStore {
  createParticipant(session: ParticipantSession): Promise<void>;
  completeParticipant(sessionId: string, completedAt: string, totalCompletionTimeMs: number): Promise<void>;
  saveTrialResponse(response: TrialResponse): Promise<void>;
  getAdminData(): Promise<AdminData>;
}

const PARTICIPANT_KEY = "aiStatementStudy.participants.v1";
const RESPONSE_KEY = "aiStatementStudy.responses.v1";

class LocalStorageStore implements DataStore {
  async createParticipant(session: ParticipantSession): Promise<void> {
    const participants = readLocal<ParticipantSession>(PARTICIPANT_KEY);
    writeLocal(PARTICIPANT_KEY, [...participants.filter((item) => item.id !== session.id), session]);
  }

  async completeParticipant(sessionId: string, completedAt: string, totalCompletionTimeMs: number): Promise<void> {
    const participants = readLocal<ParticipantSession>(PARTICIPANT_KEY).map((item) =>
      item.id === sessionId ? { ...item, completedAt, totalCompletionTimeMs } : item,
    );
    writeLocal(PARTICIPANT_KEY, participants);
  }

  async saveTrialResponse(response: TrialResponse): Promise<void> {
    const responses = readLocal<TrialResponse>(RESPONSE_KEY);
    writeLocal(RESPONSE_KEY, [...responses.filter((item) => item.id !== response.id), response]);
  }

  async getAdminData(): Promise<AdminData> {
    return {
      participants: readLocal<ParticipantSession>(PARTICIPANT_KEY),
      responses: readLocal<TrialResponse>(RESPONSE_KEY),
    };
  }
}

class SupabaseRestStore implements DataStore {
  private readonly fallback = new LocalStorageStore();

  constructor(
    private readonly url: string,
    private readonly anonKey: string,
  ) {}

  async createParticipant(session: ParticipantSession): Promise<void> {
    await this.withFallback(
      () => this.request(experimentConfig.database.participantTable, "POST", toParticipantRow(session)),
      () => this.fallback.createParticipant(session),
    );
  }

  async completeParticipant(sessionId: string, completedAt: string, totalCompletionTimeMs: number): Promise<void> {
    await this.withFallback(
      () =>
        this.request(`${experimentConfig.database.participantTable}?id=eq.${encodeURIComponent(sessionId)}`, "PATCH", {
          completed_at: completedAt,
          total_completion_time_ms: totalCompletionTimeMs,
        }),
      () => this.fallback.completeParticipant(sessionId, completedAt, totalCompletionTimeMs),
    );
  }

  async saveTrialResponse(response: TrialResponse): Promise<void> {
    await this.withFallback(
      () => this.request(experimentConfig.database.responseTable, "POST", toResponseRow(response)),
      () => this.fallback.saveTrialResponse(response),
    );
  }

  async getAdminData(): Promise<AdminData> {
    try {
      const [participants, responses] = await Promise.all([
        this.request(`${experimentConfig.database.participantTable}?select=*&order=started_at.desc`, "GET"),
        this.request(`${experimentConfig.database.responseTable}?select=*&order=submitted_at.desc`, "GET"),
      ]);
      const localData = await this.fallback.getAdminData();

      return {
        participants: mergeById(
          (participants as ParticipantRow[]).map(fromParticipantRow),
          localData.participants,
        ),
        responses: mergeById((responses as ResponseRow[]).map(fromResponseRow), localData.responses),
      };
    } catch (error) {
      console.warn("Supabase read failed; using local data.", error);
      return this.fallback.getAdminData();
    }
  }

  private async withFallback(primary: () => Promise<unknown>, fallback: () => Promise<void>): Promise<void> {
    try {
      await primary();
    } catch (error) {
      console.warn("Supabase write failed; saving locally.", error);
      await fallback();
    }
  }

  private async request(path: string, method: "GET" | "POST" | "PATCH", body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      apikey: this.anonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    if (!this.anonKey.startsWith("sb_publishable_")) {
      headers.Authorization = `Bearer ${this.anonKey}`;
    }

    const response = await fetch(`${this.url.replace(/\/$/, "")}/rest/v1/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Supabase ${method} failed: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }
}

interface ParticipantRow {
  id: string;
  participant_id: string;
  condition: string;
  age: number;
  gender: string;
  education: string;
  started_at: string;
  completed_at: string | null;
  total_completion_time_ms: number | null;
  statement_order: string[];
}

interface ResponseRow {
  id: string;
  participant_session_id: string;
  participant_id: string;
  condition: string;
  trial_number: number;
  statement_id: string;
  statement_text: string;
  ground_truth: boolean;
  confidence_rating: number;
  statement_appeared_at: string;
  submitted_at: string;
  response_time_ms: number;
}

function toParticipantRow(session: ParticipantSession): ParticipantRow {
  return {
    id: session.id,
    participant_id: session.participantId,
    condition: session.condition,
    age: session.age,
    gender: session.gender,
    education: session.education,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    total_completion_time_ms: session.totalCompletionTimeMs,
    statement_order: session.statementOrder,
  };
}

function fromParticipantRow(row: ParticipantRow): ParticipantSession {
  return {
    id: row.id,
    participantId: row.participant_id,
    condition: row.condition,
    age: row.age,
    gender: row.gender,
    education: row.education,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totalCompletionTimeMs: row.total_completion_time_ms,
    statementOrder: row.statement_order || [],
  };
}

function toResponseRow(response: TrialResponse): ResponseRow {
  return {
    id: response.id,
    participant_session_id: response.participantSessionId,
    participant_id: response.participantId,
    condition: response.condition,
    trial_number: response.trialNumber,
    statement_id: response.statementId,
    statement_text: response.statementText,
    ground_truth: response.groundTruth,
    confidence_rating: response.confidenceRating,
    statement_appeared_at: response.statementAppearedAt,
    submitted_at: response.submittedAt,
    response_time_ms: response.responseTimeMs,
  };
}

function fromResponseRow(row: ResponseRow): TrialResponse {
  return {
    id: row.id,
    participantSessionId: row.participant_session_id,
    participantId: row.participant_id,
    condition: row.condition,
    trialNumber: row.trial_number,
    statementId: row.statement_id,
    statementText: row.statement_text,
    groundTruth: row.ground_truth,
    confidenceRating: row.confidence_rating,
    statementAppearedAt: row.statement_appeared_at,
    submittedAt: row.submitted_at,
    responseTimeMs: row.response_time_ms,
  };
}

function readLocal<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]): T[] {
  const merged = new Map<string, T>();

  for (const item of fallback) {
    merged.set(item.id, item);
  }

  for (const item of primary) {
    merged.set(item.id, item);
  }

  return Array.from(merged.values());
}

export const dataStore: DataStore =
  experimentConfig.database.supabaseUrl && experimentConfig.database.supabaseAnonKey
    ? new SupabaseRestStore(experimentConfig.database.supabaseUrl, experimentConfig.database.supabaseAnonKey)
    : new LocalStorageStore();
