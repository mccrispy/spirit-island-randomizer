import { describe, expect, it } from "vitest";
import {
    canFavouriteLayout,
    canExcludeLayout,
    getLayoutSelectorValue,
    getBoardCountFavouriteLayout,
    getBoardCountSelectedLayout,
    isFavouriteLayoutSelection,
    RANDOM_LAYOUT,
    setFavouriteLayoutForBoardCount,
    setLayoutExcludedForBoardCount,
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

    it("allows Random to be favourited for multiple boards but not for one board", () => {
        expect(canFavouriteLayout(2, "", 4, false)).toBe(true);
        expect(canFavouriteLayout(1, "standard", 1, false)).toBe(true);
        expect(canFavouriteLayout(1, "", 1, false)).toBe(false);
        expect(canFavouriteLayout(2, "", 4, true)).toBe(false);
        expect(canFavouriteLayout(2, "", 0, false)).toBe(false);
    });

    it("treats a legacy one-board Random favourite as the sole available layout", () => {
        expect(
            isFavouriteLayoutSelection(
                "Standard",
                { "1": RANDOM_LAYOUT },
                1,
            ),
        ).toBe(true);
    });

    it("keeps an explicitly selected excluded layout visible so it can be restored", () => {
        expect(
            getBoardCountSelectedLayout(
                { "2": "layout-a" },
                { "2": "layout-b" },
                2,
                ["layout-a"],
            ),
        ).toBe("layout-a");
        expect(
            isFavouriteLayoutSelection("layout-b", { "2": "layout-b" }, 2, [
                "layout-b",
            ]),
        ).toBe(false);
    });

    it("makes favourite and exclusion mutually exclusive for the selected layout", () => {
        const settings = {
            ...defaultSettings(),
            preferredLayouts: { "2": "layout-a" },
            excludedLayouts: { "2": [] as string[] },
        };
        const excluded = setLayoutExcludedForBoardCount(
            settings,
            2,
            "layout-a",
            true,
        );
        expect(excluded.preferredLayouts["2"]).toBeUndefined();
        expect(excluded.excludedLayouts["2"]).toEqual(["layout-a"]);

        const favourited = setFavouriteLayoutForBoardCount(
            excluded,
            2,
            "layout-a",
        );
        expect(favourited.preferredLayouts["2"]).toBe("layout-a");
        expect(favourited.excludedLayouts["2"]).toBeUndefined();
    });

    it("uses the sole one-board layout instead of presenting a random selection", () => {
        expect(getLayoutSelectorValue(1, "", ["standard"])).toBe("standard");
        expect(getLayoutSelectorValue(2, "", ["standard"])).toBe("");
    });

    it("keeps an excluded layout selectable so an all-excluded legacy state can be repaired", () => {
        expect(
            getLayoutSelectorValue(2, "", ["layout-a", "layout-b"], [
                "layout-a",
                "layout-b",
            ]),
        ).toBe("layout-a");
    });

    it("prevents excluding the last available layout but allows restoring an exclusion", () => {
        expect(canExcludeLayout(false, 1)).toBe(false);
        expect(canExcludeLayout(false, 2)).toBe(true);
        expect(canExcludeLayout(true, 1)).toBe(true);
    });

    it("restores the favourite for the destination count without changing other saved layouts", () => {
        const settings = {
            ...defaultSettings(),
            preferredLayouts: { "2": "fragment", "3": "sunrise" },
            selectedLayouts: { "2": "coastline", "3": "standard" },
            excludedLayouts: { "2": ["coastline"], "3": ["sunrise"] },
        };

        expect(withFavouriteLayoutForBoardCount(settings, 2)).toMatchObject({
            selectedLayouts: { "2": "fragment", "3": "standard" },
        });
        expect(withFavouriteLayoutForBoardCount(settings, 3)).toMatchObject({
            selectedLayouts: { "2": "coastline", "3": "" },
        });
    });
});
