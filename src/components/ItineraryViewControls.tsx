import { CalendarDays, ChevronDown, Layers, List, StretchHorizontal, Timer } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type ItineraryViewMode = "list" | "vertical" | "horizontal";

interface ItineraryViewControlsProps {
  viewMode: ItineraryViewMode;
  onViewModeChange: (mode: ItineraryViewMode) => void;
  showStages: boolean;
  onToggleStages: () => void;
  freeTimeOnly: boolean;
  onToggleFreeTime: () => void;
}

interface ControlOption {
  key: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onSelect: () => void;
}

export const ItineraryViewControls = ({
  viewMode,
  onViewModeChange,
  showStages,
  onToggleStages,
  freeTimeOnly,
  onToggleFreeTime,
}: ItineraryViewControlsProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stagedMode = viewMode === "vertical" || viewMode === "horizontal";

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const options: ControlOption[] = [
    {
      key: "list",
      label: "List",
      icon: <List size={16} />,
      active: viewMode === "list",
      onSelect: () => onViewModeChange("list"),
    },
    {
      key: "vertical",
      label: "Vertical",
      icon: <CalendarDays size={16} />,
      active: viewMode === "vertical",
      onSelect: () => onViewModeChange("vertical"),
    },
    {
      key: "horizontal",
      label: "Horizontal",
      icon: <StretchHorizontal size={16} />,
      active: viewMode === "horizontal",
      onSelect: () => onViewModeChange("horizontal"),
    },
    ...(stagedMode
      ? [
          {
            key: "stages",
            label: "Stages",
            icon: <Layers size={16} />,
            active: showStages,
            onSelect: onToggleStages,
          },
        ]
      : []),
    {
      key: "free-time",
      label: "Free Time",
      icon: <Timer size={16} />,
      active: freeTimeOnly,
      onSelect: onToggleFreeTime,
    },
  ];

  const activeView = options.find((option) => option.key === viewMode) ?? options[0];
  const mobileButtonLabel = freeTimeOnly ? "Free Time" : activeView.label;
  const mobileButtonIcon = freeTimeOnly ? <Timer size={16} /> : activeView.icon;

  const runOption = (option: ControlOption) => {
    option.onSelect();
    setMenuOpen(false);
  };

  return (
    <>
      <div className="view-mode-buttons" data-export-hidden="true">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`secondary-button${option.active ? " is-active" : ""}`}
            onClick={option.onSelect}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <div className="itinerary-view-menu" ref={menuRef} data-export-hidden="true">
        <button
          type="button"
          className={`secondary-button view-menu-button${menuOpen ? " is-active" : ""}`}
          aria-label={`Itinerary display options. Current view: ${activeView.label}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {mobileButtonIcon}
          <span className="view-menu-button__label">{mobileButtonLabel}</span>
          <ChevronDown className="view-menu-button__chevron" size={14} />
        </button>

        {menuOpen && (
          <div className="view-menu-panel" role="menu" aria-label="Itinerary display options">
            <span className="view-menu-panel__title">Display</span>
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitem"
                className={`view-menu-option${option.active ? " is-active" : ""}`}
                aria-pressed={option.active}
                onClick={() => runOption(option)}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
