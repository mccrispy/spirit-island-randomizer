import { describe, expect, it } from "vitest";
import { TriState } from "../engine/types";
import { getNextTriState, getPreviousTriState } from "./TriStateCheckbox";

describe("tri-state transitions", () => {
    it("advances with a left-click transition", () => {
        expect(getNextTriState(TriState.UNCHECKED)).toBe(TriState.CHECKED);
        expect(getNextTriState(TriState.CHECKED)).toBe(TriState.INDETERMINATE);
        expect(getNextTriState(TriState.INDETERMINATE)).toBe(TriState.UNCHECKED);
    });

    it("reverses with a right-click transition", () => {
        expect(getPreviousTriState(TriState.UNCHECKED)).toBe(
            TriState.INDETERMINATE,
        );
        expect(getPreviousTriState(TriState.CHECKED)).toBe(TriState.UNCHECKED);
        expect(getPreviousTriState(TriState.INDETERMINATE)).toBe(TriState.CHECKED);
    });
});