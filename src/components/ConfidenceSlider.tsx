interface ConfidenceSliderProps {
  value: number;
  isSaving: boolean;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
}

export function ConfidenceSlider({ value, isSaving, onChange, onCommit }: ConfidenceSliderProps) {
  function commitRating(committedValue: number) {
    if (isSaving) return;
    onCommit(committedValue);
  }

  return (
    <section className="confidence-panel" aria-label="Confidence rating">
      <div className="confidence-question">How confident are you that this statement is true?</div>
      <div className="slider-row">
        <span>Unsure</span>
        <input
          className="confidence-slider"
          type="range"
          min="1"
          max="7"
          step="1"
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
          aria-label="Confidence rating from 1 to 7"
          disabled={isSaving}
        />
        <span>Sure</span>
      </div>
    </section>
  );
}
