import { describe, expect, it } from "vitest";
import {
    getBoardCountFavouriteLayout,
    getBoardCountSelectedLayout,
    isFavouriteLayoutSelection,
    RANDOM_LAYOUT,
    withFavouriteLayoutForBoardCount,
} from "./OptionsPanel";
import { defaultSettings } from "../persistence";

describe("layout favourite behaviour", () => {
    it("marks the current selected layout as favourite only when it matches the saved favourite", () => {
        expect(
            isFavouriteLayoutSelection("layout-b", { "2": "layout-b" }, 2),
        ).toBe(true);
        expect(
            isFavouriteLayoutSelection("layout-a", { "2": "layout-b" }, 2),
        ).toBe(false);
    });

    it("returns the saved favourite for a board count and falls back to empty when none exists", () => {
        expect(getBoardCountFavouriteLayout({ "2": "layout-b" }, 2)).toBe("layout-b");
        expect(getBoardCountFavouriteLayout({ "2": "layout-b" }, 3)).toBe("");
    });

    it("treats Random as a saved favourite instead of substituting the first layout", () => {
        const preferredLayouts = { "2": RANDOM_LAYOUT };

        expect(getBoardCountSelectedLayout({}, preferredLayouts, 2)).toBe("");
        expect(isFavouriteLayoutSelection("", preferredLayouts, 2)).toBe(true);
    });

    it("restores the favourite for the destination count without changing other saved layouts", () => {
        const settings = {
            ...defaultSettings(),
            preferredLayouts: { "2": "fragment", "3": "sunrise" },
            selectedLayouts: { "2": "coastline", "3": "standard" },
        };

        expect(withFavouriteLayoutForBoardCount(settings, 2)).toMatchObject({
            selectedLayouts: { "2": "fragment", "3": "standard" },
        });
        expect(withFavouriteLayoutForBoardCount(settings, 3)).toMatchObject({
            selectedLayouts: { "2": "coastline", "3": "sunrise" },
        });
    });
});
