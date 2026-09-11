import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, Minus, Star } from "lucide-react";
import { TriState } from "../engine/types";

interface Props {
  value: TriState;
  onChange: (value: TriState) => void;
  label: string;
}

export function getNextTriState(value: TriState): TriState {
  switch (value) {
    case TriState.UNCHECKED:
      return TriState.CHECKED;
    case TriState.CHECKED:
      return TriState.INDETERMINATE;
    case TriState.INDETERMINATE:
      return TriState.UNCHECKED;
  }
}

export function getPreviousTriState(value: TriState): TriState {
  switch (value) {
    case TriState.UNCHECKED:
      return TriState.INDETERMINATE;
    case TriState.CHECKED:
      return TriState.UNCHECKED;
    case TriState.INDETERMINATE:
      return TriState.CHECKED;
  }
}

export function TriStateIcon({
  value,
  size = 14,
}: {
  value: TriState;
  size?: number;
}) {
  if (value === TriState.CHECKED) return <Check size={size} />;
  if (value === TriState.INDETERMINATE)
    return <Star size={size - 2} fill="currentColor" />;
  return <Minus size={size} />;
}

export function TriStateCheckbox({ value, onChange, label }: Props) {
  const next = getNextTriState(value);
  const previous = getPreviousTriState(value);

  const tooltip =
    value === TriState.UNCHECKED
      ? `Excluded: ${label}. Left click to include, right click to force.`
      : value === TriState.CHECKED
        ? `Included: ${label}. Left click to force, right click to exclude.`
        : `Forced: ${label}. Left click to exclude, right click to include.`;

  return (
    <Checkbox.Root
      className={`tri-state ${value.toLowerCase()}`}
      checked={value === TriState.CHECKED}
      onClick={(event) => {
        if (event.detail !== 0) {
          event.preventDefault();
          onChange(next);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          onChange(next);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onChange(previous);
      }}
      aria-label={label}
      title={tooltip}
    >
      <TriStateIcon value={value} />
    </Checkbox.Root>
  );
}

const LEGEND_ITEMS: { value: TriState; label: string }[] = [
  { value: TriState.UNCHECKED, label: "Excluded" },
  { value: TriState.CHECKED, label: "In pool" },
  { value: TriState.INDETERMINATE, label: "Forced" },
];

export function TriStateLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`selection-legend-row${compact ? " compact" : ""}`}
      aria-label="Tri-state selection legend"
    >
      {LEGEND_ITEMS.map(({ value, label }) => (
        <div className="selection-legend-item" key={value}>
          <span className={`tri-state legend-swatch ${value.toLowerCase()}`}>
            <TriStateIcon value={value} size={12} />
          </span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
