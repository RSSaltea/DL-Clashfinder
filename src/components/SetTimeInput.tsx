import type { ArtistSetTime } from "../types";

interface SetTimeInputProps {
  value: ArtistSetTime;
  onChange: (value: ArtistSetTime) => void;
  compact?: boolean;
}

export const SetTimeInput = ({ value, onChange, compact = false }: SetTimeInputProps) => (
  <div className={`time-inputs ${compact ? "is-compact" : ""}`}>
    <label>
      <span>Start</span>
      <input
        type="time"
        value={value.start ?? ""}
        onChange={(event) => onChange({ ...value, start: event.target.value })}
      />
    </label>
    <label>
      <span>End</span>
      <input
        type="time"
        value={value.end ?? ""}
        onChange={(event) => onChange({ ...value, end: event.target.value })}
      />
    </label>
  </div>
);
