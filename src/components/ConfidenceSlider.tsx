import { experimentConfig } from "../config/experimentConfig";

interface ConfidenceSliderProps {
  value: number;
  isSaving: boolean;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
}

export function ConfidenceSlider({ value, isSaving, onChange, onCommit }: ConfidenceSliderProps) {
  const { min, max, step, lowLabel, highLabel } = experimentConfig.ratingScale;

  function commitRating(committedValue: number) {
    if (isSaving) return;
    onCommit(committedValue);
  }

  return (
    <section className="confidence-panel" aria-label="Confidence rating">
      <div className="confidence-question">How confident are you that this statement is true?</div>
      <div className="slider-row">
        <span>{lowLabel}</span>
        <input
          className="confidence-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={() => onChange(value)}
          onPointerUp={(event) => commitRating(Number(event.currentTarget.value))}
          onTouchEnd={(event) => commitRating(Number(event.currentTarget.value))}
          onKeyUp={(event) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
              commitRating(Number(event.currentTarget.value));
            }
          }}
          aria-label={`Confidence rating from ${min} to ${max}`}
          disabled={isSaving}
        />
        <span>{highLabel}</span>
      </div>
    </section>
  );
}
