import type { ReactNode } from "react";

interface StudyFrameProps {
  children: ReactNode;
  className?: string;
}

export function StudyFrame({ children, className = "" }: StudyFrameProps) {
  return (
    <main className={`study-frame ${className}`}>
      <div className="ambient-star" aria-hidden="true" />
      <div className="screen-content">{children}</div>
    </main>
  );
}

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="progress-wrap" aria-label={`Statement ${current} of ${total}`}>
      <div className="progress-label">Statement {current} of {total}</div>
      <div className="progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
