import { BadgeCheck, Heart } from "lucide-react";
import type { Intent } from "../types";

interface IntentButtonsProps {
  intent?: Intent;
  onChange: (intent: Intent) => void;
}

export const IntentButtons = ({ intent, onChange }: IntentButtonsProps) => (
  <div className="intent-buttons" aria-label="Artist preference">
    <button
      type="button"
      className={`icon-text-button ${intent === "interested" ? "is-active" : ""}`}
      aria-pressed={intent === "interested"}
      title="Mark as interested"
      onClick={() => onChange("interested")}
    >
      <Heart size={16} />
      <span>Interested</span>
    </button>
    <button
      type="button"
      className={`icon-text-button definite ${intent === "definite" ? "is-active" : ""}`}
      aria-pressed={intent === "definite"}
      title="Mark as definite"
      onClick={() => onChange("definite")}
    >
      <BadgeCheck size={16} />
      <span>Definite</span>
    </button>
  </div>
);
