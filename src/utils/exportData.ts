import writeXlsxFile from "write-excel-file/browser";
import type { AdminData, ParticipantSession, TrialResponse } from "../types/experiment";

export function downloadCsv(data: AdminData): void {
  const participantRows: Record<string, unknown>[] = data.participants.map((participant) => ({
    record_type: "participant",
    participant_session_id: participant.id,
    participant_id: participant.participantId,
    condition: participant.condition,
    age: participant.age,
    gender: participant.gender,
    education: participant.education,
    started_at: participant.startedAt,
    completed_at: participant.completedAt || "",
    total_completion_time_ms: participant.totalCompletionTimeMs || "",
    statement_order: participant.statementOrder.join("|"),
    trial_number: "",
    statement_id: "",
    statement_text: "",
    ground_truth: "",
    confidence_rating: "",
    statement_appeared_at: "",
    response_time_ms: "",
    answer_submitted_at: "",
  }));

  const responseRows: Record<string, unknown>[] = data.responses.map((response) => ({
    record_type: "trial_response",
    participant_session_id: response.participantSessionId,
    participant_id: response.participantId,
    condition: response.condition,
    age: "",
    gender: "",
    education: "",
    started_at: "",
    completed_at: "",
    total_completion_time_ms: "",
    statement_order: "",
    trial_number: response.trialNumber,
    statement_id: response.statementId,
    statement_text: response.statementText,
    ground_truth: response.groundTruth ? "True" : "False",
    confidence_rating: response.confidenceRating,
    statement_appeared_at: response.statementAppearedAt,
    response_time_ms: response.responseTimeMs,
    answer_submitted_at: response.submittedAt,
  }));

  const rows = [...participantRows, ...responseRows];
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join(
    "\n",
  );

  downloadBlob("ai-statement-study-data.csv", "text/csv;charset=utf-8", csv);
}

export async function downloadExcel(data: AdminData): Promise<void> {
  await writeXlsxFile(
    [
      {
        sheet: "Participants",
        data: rowsToSheet(data.participants.map(participantForExport)),
      },
      {
        sheet: "Responses",
        data: rowsToSheet(data.responses.map(responseForExport)),
      },
    ],
  ).toFile("ai-statement-study-data.xlsx");
}

function participantForExport(participant: ParticipantSession): Record<string, string | number | null> {
  return {
    participant_session_id: participant.id,
    participant_id: participant.participantId,
    condition: participant.condition,
    age: participant.age,
    gender: participant.gender,
    education: participant.education,
    started_at: participant.startedAt,
    completed_at: participant.completedAt,
    total_completion_time_ms: participant.totalCompletionTimeMs,
    statement_order: participant.statementOrder.join("|"),
  };
}

function responseForExport(response: TrialResponse): Record<string, string | number | boolean> {
  return {
    response_id: response.id,
    participant_session_id: response.participantSessionId,
    participant_id: response.participantId,
    condition: response.condition,
    trial_number: response.trialNumber,
    statement_id: response.statementId,
    statement_text: response.statementText,
    ground_truth: response.groundTruth,
    confidence_rating: response.confidenceRating,
    statement_appeared_at: response.statementAppearedAt,
    answer_submitted_at: response.submittedAt,
    response_time_ms: response.responseTimeMs,
  };
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

type SheetCell = {
  value: string | number | boolean;
  fontWeight?: "bold";
};

function rowsToSheet(rows: Record<string, unknown>[]): SheetCell[][] {
  const headers = Object.keys(rows[0] || {});
  return [
    headers.map((header) => ({ value: header, fontWeight: "bold" })),
    ...rows.map((row) =>
      headers.map((header) => {
        const value = row[header];
        return {
          value:
            typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
              ? value ?? ""
              : String(value ?? ""),
        };
      }),
    ),
  ];
}

function downloadBlob(filename: string, type: string, content: BlobPart): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
