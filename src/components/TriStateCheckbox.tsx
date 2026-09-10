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
      {value === TriState.CHECKED && <Check size={14} />}
      {value === TriState.INDETERMINATE && (
        <Star size={12} fill="currentColor" />
      )}
      {value === TriState.UNCHECKED && <Minus size={14} />}
    </Checkbox.Root>
  );
}
