import { useEffect, useMemo, useRef, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { AiAvatar, LoadingCue } from "./components/LoadingCue";
import { ConfidenceSlider } from "./components/ConfidenceSlider";
import { PillButton, PillInput, PillSelect } from "./components/FormControls";
import { ProgressBar, StudyFrame } from "./components/StudyFrame";
import { conditions, experimentConfig, statements } from "./config/experimentConfig";
import { dataStore } from "./services/dataStore";
import type { ConditionId, Demographics, ParticipantSession, StatementItem, TrialResponse } from "./types/experiment";
import { pickEqualProbability, randomBetween, randomId, shuffle } from "./utils/random";

type Page = "welcome" | "consent" | "demographics" | "instructions" | "trial" | "complete";
type DemographicStep = "age" | "gender" | "education";
type TrialPhase = "ready" | "loading" | "rating" | "saving";

function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.hash === "#/admin");

  useEffect(() => {
    const handleHashChange = () => setIsAdminRoute(window.location.hash === "#/admin");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (isAdminRoute) {
    return <AdminDashboard />;
  }

  return <StudyApp />;
}

function StudyApp() {
  const [page, setPage] = useState<Page>("welcome");
  const [participantId, setParticipantId] = useState(() => randomId(experimentConfig.participantIdPrefix));
  const [demographics, setDemographics] = useState<Partial<Demographics>>({});
  const [demographicStep, setDemographicStep] = useState<DemographicStep>("age");
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [statementOrder, setStatementOrder] = useState<StatementItem[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trialPhase, setTrialPhase] = useState<TrialPhase>("ready");
  const [appearedAt, setAppearedAt] = useState<string | null>(null);
  const [rating, setRating] = useState(experimentConfig.ratingScale.defaultValue);
  const [error, setError] = useState("");
  const submitLock = useRef(false);

  const assignedCondition = useMemo(() => {
    if (!session) return null;
    return conditions.find((condition) => condition.id === session.condition) || conditions[0];
  }, [session]);

  const currentStatement = statementOrder[trialIndex];

  useEffect(() => {
    if (trialPhase !== "loading") return;

    const delay = randomBetween(experimentConfig.loadingDurationMs.min, experimentConfig.loadingDurationMs.max);
    const timer = window.setTimeout(() => {
      setAppearedAt(new Date().toISOString());
      setTrialPhase("rating");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [trialPhase, trialIndex]);

  function resetForNewParticipant() {
    setParticipantId(randomId(experimentConfig.participantIdPrefix));
    setDemographics({});
    setDemographicStep("age");
    setSession(null);
    setStatementOrder([]);
    setTrialIndex(0);
    setTrialPhase("ready");
    setAppearedAt(null);
    setRating(experimentConfig.ratingScale.defaultValue);
    setError("");
    submitLock.current = false;
    setPage("welcome");
  }

  async function beginExperiment() {
    if (!demographics.age || !demographics.gender || !demographics.education) return;

    const selectedCondition = pickEqualProbability(conditions);
    const randomizedStatements = buildStatementOrder();
    const startedAt = new Date().toISOString();
    const participantSession: ParticipantSession = {
      id: randomId("S"),
      participantId,
      condition: selectedCondition.id as ConditionId,
      age: demographics.age,
      gender: demographics.gender,
      education: demographics.education,
      startedAt,
      completedAt: null,
      totalCompletionTimeMs: null,
      statementOrder: randomizedStatements.map((statement) => statement.id),
    };

    setError("");
    submitLock.current = false;
    setSession(participantSession);
    setStatementOrder(randomizedStatements);

    try {
      await dataStore.createParticipant(participantSession);
      setPage("instructions");
    } catch {
      setError("The study could not start. Please try again.");
    }
  }

  async function submitTrialResponse(committedRating: number) {
    if (!session || !currentStatement || !appearedAt) return;
    if (submitLock.current) return;

    submitLock.current = true;

    const submittedAt = new Date().toISOString();
    const response: TrialResponse = {
      id: randomId("R"),
      participantSessionId: session.id,
      participantId: session.participantId,
      condition: session.condition,
      trialNumber: trialIndex + 1,
      statementId: currentStatement.id,
      statementText: currentStatement.text,
      groundTruth: currentStatement.groundTruth,
      confidenceRating: committedRating,
      statementAppearedAt: appearedAt,
      submittedAt,
      responseTimeMs: new Date(submittedAt).getTime() - new Date(appearedAt).getTime(),
    };

    setTrialPhase("saving");
    await dataStore.saveTrialResponse(response);

    if (trialIndex + 1 >= statementOrder.length) {
      const completedAt = new Date().toISOString();
      const totalCompletionTimeMs = new Date(completedAt).getTime() - new Date(session.startedAt).getTime();
      await dataStore.completeParticipant(session.id, completedAt, totalCompletionTimeMs);
      setSession({ ...session, completedAt, totalCompletionTimeMs });
      setPage("complete");
      return;
    }

    setTrialIndex((current) => current + 1);
    setTrialPhase("ready");
    setAppearedAt(null);
    setRating(experimentConfig.ratingScale.defaultValue);
    submitLock.current = false;
  }

  if (page === "welcome") {
    return (
      <StudyFrame className="center-page">
        <h1 className="hello-title">Hello.</h1>
        <PillButton className="bottom-button" onClick={() => setPage("consent")}>
          Begin
        </PillButton>
      </StudyFrame>
    );
  }

  if (page === "consent") {
    return (
      <StudyFrame className="notice-page">
        <section className="notice-copy">
          <h1>{experimentConfig.consent.title}</h1>
          <p>{experimentConfig.consent.text}</p>
        </section>
        <PillButton className="bottom-button" onClick={() => setPage("demographics")}>
          {experimentConfig.consent.agreeButton}
        </PillButton>
      </StudyFrame>
    );
  }

  if (page === "demographics") {
    return (
      <StudyFrame className="center-page">
        <div className="participant-chip">Participant ID: {participantId}</div>
        <DemographicsStep
          step={demographicStep}
          demographics={demographics}
          setDemographics={setDemographics}
          onBack={() =>
            setDemographicStep((current) =>
              current === "education" ? "gender" : current === "gender" ? "age" : "age",
            )
          }
          onNext={() => {
            if (demographicStep === "age") setDemographicStep("gender");
            if (demographicStep === "gender") setDemographicStep("education");
            if (demographicStep === "education") void beginExperiment();
          }}
        />
        {error ? <p className="error-text">{error}</p> : null}
      </StudyFrame>
    );
  }

  if (page === "instructions") {
    return (
      <StudyFrame className="center-page">
        <section className="instruction-copy">
          {experimentConfig.instructions.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
        <PillButton className="bottom-button" onClick={() => setPage("trial")}>
          Start
        </PillButton>
      </StudyFrame>
    );
  }

  if (page === "complete") {
    return (
      <StudyFrame className="center-page">
        <section className="completion-copy">
          <h1>Thank you for participating.</h1>
          <p>Your responses have been successfully recorded.</p>
        </section>
        <PillButton className="bottom-button" onClick={resetForNewParticipant}>
          Finish
        </PillButton>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame className="trial-page">
      {experimentConfig.progressBarVisible ? <ProgressBar current={trialIndex + 1} total={statementOrder.length} /> : null}
      <section className="chat-stage">
        {trialPhase === "ready" ? (
          <div className="ready-card">
            <AiAvatar />
            <div>
              <p>AI assistant is ready to generate the next statement.</p>
              <PillButton onClick={() => setTrialPhase("loading")}>Generate Response</PillButton>
            </div>
          </div>
        ) : null}

        {trialPhase === "loading" && assignedCondition ? <LoadingCue text={assignedCondition.loadingText} /> : null}

        {(trialPhase === "rating" || trialPhase === "saving") && currentStatement ? (
          <div className="ai-response">
            <AiAvatar />
            <p>{currentStatement.text}</p>
          </div>
        ) : null}
      </section>

      {(trialPhase === "rating" || trialPhase === "saving") && (
        <ConfidenceSlider
          value={rating}
          isSaving={trialPhase === "saving"}
          onChange={(value) => {
            setRating(value);
          }}
          onCommit={(value) => void submitTrialResponse(value)}
        />
      )}
    </StudyFrame>
  );
}

interface DemographicsStepProps {
  step: DemographicStep;
  demographics: Partial<Demographics>;
  setDemographics: (value: Partial<Demographics>) => void;
  onBack: () => void;
  onNext: () => void;
}

function DemographicsStep({ step, demographics, setDemographics, onBack, onNext }: DemographicsStepProps) {
  const canProceed =
    (step === "age" && Boolean(demographics.age)) ||
    (step === "gender" && Boolean(demographics.gender)) ||
    (step === "education" && Boolean(demographics.education));

  return (
    <section className="demographic-step">
      {step === "age" ? (
        <PillInput
          label="Age:"
          min={18}
          max={120}
          type="number"
          value={demographics.age || ""}
          onChange={(event) => setDemographics({ ...demographics, age: Number(event.target.value) })}
        />
      ) : null}

      {step === "gender" ? (
        <PillSelect
          label="Gender:"
          options={experimentConfig.demographics.genderOptions}
          value={demographics.gender || ""}
          onChange={(event) => setDemographics({ ...demographics, gender: event.target.value })}
        />
      ) : null}

      {step === "education" ? (
        <PillSelect
          label="Highest Education:"
          options={experimentConfig.demographics.educationOptions}
          value={demographics.education || ""}
          onChange={(event) => setDemographics({ ...demographics, education: event.target.value })}
        />
      ) : null}

      <div className="step-actions">
        {step !== "age" ? (
          <PillButton variant="secondary" onClick={onBack}>
            Back
          </PillButton>
        ) : null}
        <PillButton disabled={!canProceed} onClick={onNext}>
          {step === "education" ? "Continue" : "Next"}
        </PillButton>
      </div>
    </section>
  );
}

function buildStatementOrder(): StatementItem[] {
  const trueStatements = shuffle(statements.filter((statement) => statement.groundTruth));
  const otherStatements = shuffle(statements.filter((statement) => !statement.groundTruth));

  if (!trueStatements.length) {
    return shuffle(statements);
  }

  return [trueStatements[0], ...shuffle([...trueStatements.slice(1), ...otherStatements])];
}

export default App;
