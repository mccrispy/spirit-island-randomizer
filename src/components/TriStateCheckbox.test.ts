import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TriState } from "../engine/types";
import {
    getNextTriState,
    getPreviousTriState,
    TriStateIcon,
} from "./TriStateCheckbox";

describe("tri-state transitions", () => {
    it("advances with a left-click transition", () => {
        expect(getNextTriState(TriState.UNCHECKED)).toBe(TriState.CHECKED);
        expect(getNextTriState(TriState.CHECKED)).toBe(TriState.INDETERMINATE);
        expect(getNextTriState(TriState.INDETERMINATE)).toBe(TriState.UNCHECKED);
    });

    describe("tri-state selected icon", () => {
        it("renders an enlarged, bold checkmark for the in-pool state", () => {
            const markup = renderToStaticMarkup(
                createElement(TriStateIcon, { value: TriState.CHECKED }),
            );

            expect(markup).toContain('width="16"');
            expect(markup).toContain('stroke-width="3.5"');
        });
    });

    it("reverses with a right-click transition", () => {
        expect(getPreviousTriState(TriState.UNCHECKED)).toBe(
            TriState.INDETERMINATE,
        );
        expect(getPreviousTriState(TriState.CHECKED)).toBe(TriState.UNCHECKED);
        expect(getPreviousTriState(TriState.INDETERMINATE)).toBe(TriState.CHECKED);
    });
});