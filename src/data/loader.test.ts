import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadAllData } from "./loader";
import { createSeededRng, generateSetup } from "../engine/randomizer";
import { TriState } from "../engine/types";

const expansionFiles = [
    "Base Game.json",
    "Branch and Claw.json",
    "Feather and Flame.json",
    "Horizons of Spirit Island.json",
    "Jagged Earth.json",
    "Nature Incarnate.json",
];

function createJsonResponse(body: string) {
    return new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

describe("loader", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", async (input: RequestInfo) => {
            const url = typeof input === "string" ? input : input.url;
            if (!url.startsWith("/data/")) {
                throw new Error(`Unexpected fetch URL: ${url}`);
            }

            const filename = decodeURIComponent(url.slice("/data/".length));
            const path = resolve(process.cwd(), "public", "data", filename);
            const body = readFileSync(path, "utf-8");
            return createJsonResponse(body);
        });
    });

    it("loads game data from public JSON files", async () => {
        const data = await loadAllData();
        expect(data.spirits.length).toBeGreaterThan(0);
        expect(data.aspects.length).toBeGreaterThan(0);
        expect(data.boards.length).toBeGreaterThan(0);
        expect(data.adversaries.length).toBeGreaterThan(0);
        expect(data.scenarios.length).toBeGreaterThan(0);
        expect(Object.keys(data.baseSpiritMap).length).toBeGreaterThan(0);
        expect(data.layouts.length).toBeGreaterThan(0);
    });

    it("generates a setup with loaded data", async () => {
        const data = await loadAllData();
        const selectionState = Object.fromEntries(
            [
                ...data.spirits.map((spirit) => spirit.canonicalName),
                ...data.aspects.map((aspect) => aspect.canonicalName),
                ...data.boards.map((board) => board.canonicalName),
                ...data.adversaries.map((adversary) => adversary.canonicalName),
                ...data.scenarios.map((scenario) => scenario.canonicalName),
            ].map((name) => [name, TriState.CHECKED])
        );

        const result = generateSetup(
            data,
            {
                expansions: ["Base Game"],
                selectionState,
            },
            createSeededRng(123)
        );

        expect(result.selectedBoards.length).toBeGreaterThan(0);
        expect(result.selectedBoards[0].board).toBeDefined();
        expect(result.selectedBoards[0].boardSide).toBeDefined();
        expect(result.selectedSpirits.length).toBeGreaterThan(0);
        expect(result.selectedSpirits[0].spirit).toBeDefined();
        expect(result.adversary).toBeDefined();
        expect(result.scenario).toBeDefined();
        expect(result.generatedAt).toBeTruthy();
    });
});
