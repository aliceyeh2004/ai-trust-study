interface LoadingCueProps {
  text: string;
}

export function LoadingCue({ text }: LoadingCueProps) {
  return (
    <div className="loading-cue" aria-live="polite">
      <span>{text}</span>
      <span className="animated-dots" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function AiAvatar() {
  return (
    <div className="ai-avatar" aria-label="AI assistant">
      AI
    </div>
  );
}
