import { useEffect, useMemo, useState } from "react";
import { conditions, experimentConfig } from "../config/experimentConfig";
import { dataStore } from "../services/dataStore";
import type { AdminData } from "../types/experiment";
import { downloadCsv, downloadExcel } from "../utils/exportData";
import { PillButton } from "./FormControls";
import { StudyFrame } from "./StudyFrame";

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [data, setData] = useState<AdminData>({ participants: [], responses: [] });
  const [conditionFilter, setConditionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isUnlocked) return;
    void refreshData();
  }, [isUnlocked]);

  const filteredParticipants = useMemo(() => {
    return data.participants.filter((participant) => {
      const matchesCondition = conditionFilter === "all" || participant.condition === conditionFilter;
      const matchesSearch = participant.participantId.toLowerCase().includes(search.toLowerCase());
      return matchesCondition && matchesSearch;
    });
  }, [conditionFilter, data.participants, search]);

  const filteredParticipantIds = new Set(filteredParticipants.map((participant) => participant.participantId));
  const filteredResponses = data.responses.filter((response) => filteredParticipantIds.has(response.participantId));

  async function refreshData() {
    setError("");
    try {
      setData(await dataStore.getAdminData());
    } catch {
      setError("Unable to load study data.");
    }
  }

  if (!isUnlocked) {
    return (
      <StudyFrame className="admin-login">
        <section className="admin-card narrow">
          <h1>Researcher Dashboard</h1>
          <p>Enter the researcher password to view study records.</p>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
          />
          <PillButton
            onClick={() => {
              if (password === experimentConfig.admin.password) {
                setIsUnlocked(true);
              } else {
                setError("Incorrect password.");
              }
            }}
          >
            Open Dashboard
          </PillButton>
          {error ? <p className="error-text">{error}</p> : null}
        </section>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame className="admin-page">
      <section className="admin-card">
        <div className="admin-header">
          <div>
            <h1>Researcher Dashboard</h1>
            <p>
              {filteredParticipants.length} participants, {filteredResponses.length} responses shown
            </p>
          </div>
          <div className="admin-actions">
            <PillButton variant="secondary" onClick={() => void refreshData()}>
              Refresh
            </PillButton>
            <PillButton variant="secondary" onClick={() => downloadCsv(data)}>
              CSV
            </PillButton>
            <PillButton onClick={() => void downloadExcel(data)}>Excel</PillButton>
          </div>
        </div>

        <div className="admin-filters">
          <label>
            <span>Condition</span>
            <select value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value)}>
              <option value="all">All conditions</option>
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Search Participant ID</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Participant ID" />
          </label>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="admin-grid">
          <section>
            <h2>Participants</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Participant ID</th>
                    <th>Condition</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Education</th>
                    <th>Started</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.id}>
                      <td>{participant.participantId}</td>
                      <td>{participant.condition}</td>
                      <td>{participant.age}</td>
                      <td>{participant.gender}</td>
                      <td>{participant.education}</td>
                      <td>{formatDate(participant.startedAt)}</td>
                      <td>{participant.completedAt ? formatDate(participant.completedAt) : "In progress"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>Responses</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Participant ID</th>
                    <th>Trial</th>
                    <th>Statement</th>
                    <th>Truth</th>
                    <th>Rating</th>
                    <th>Appeared</th>
                    <th>Submitted</th>
                    <th>RT (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response) => (
                    <tr key={response.id}>
                      <td>{response.participantId}</td>
                      <td>{response.trialNumber}</td>
                      <td>{response.statementId}</td>
                      <td>{response.groundTruth ? "True" : "False"}</td>
                      <td>{response.confidenceRating}</td>
                      <td>{formatTimestamp(response.statementAppearedAt)}</td>
                      <td>{formatTimestamp(response.submittedAt)}</td>
                      <td>{response.responseTimeMs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </StudyFrame>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
