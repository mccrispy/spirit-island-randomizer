import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, Minus, Star } from "lucide-react";
import { TriState } from "../engine/types";

interface Props {
  value: TriState;
  onChange: (value: TriState) => void;
  label: string;
}

export function TriStateCheckbox({ value, onChange, label }: Props) {
  const next =
    value === TriState.UNCHECKED
      ? TriState.CHECKED
      : value === TriState.CHECKED
        ? TriState.INDETERMINATE
        : TriState.UNCHECKED;
  return (
    <Checkbox.Root
      className={`tri-state ${value.toLowerCase()}`}
      checked={value === TriState.CHECKED}
      onCheckedChange={() => onChange(next)}
      aria-label={label}
    >
      {value === TriState.CHECKED && <Check size={14} />}
      {value === TriState.INDETERMINATE && (
        <Star size={12} fill="currentColor" />
      )}
      {value === TriState.UNCHECKED && <Minus size={14} />}
    </Checkbox.Root>
  );
}
