import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TriState } from "../engine/types";
import { defaultSettings } from "../persistence";
import { ResultsPanel } from "./ResultsPanel";

const { useAppStateMock } = vi.hoisted(() => ({
  useAppStateMock: vi.fn(),
}));

vi.mock("../state/AppStateContext", () => ({
  useAppState: useAppStateMock,
}));

describe("ResultsPanel thematic forced-board warning", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("warns when a board is forced while Thematic Boards is enabled", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    useAppStateMock.mockReturnValue({
      data: {
        boards: [{ canonicalName: "BoardA" }],
        layouts: [],
      },
      selectionState: { BoardA: TriState.INDETERMINATE },
      settings: { ...defaultSettings(), useThematicBoards: true },
      result: null,
      running: false,
      generate: vi.fn(),
      clearResult: vi.fn(),
    });

    await act(async () => root.render(<ResultsPanel />));

    expect(container.textContent).toContain(
      "Forced board selections are ignored when Thematic Boards is enabled",
    );

    await act(async () => root.unmount());
    container.remove();
  });

  it("does not warn when thematic boards are disabled", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    useAppStateMock.mockReturnValue({
      data: {
        boards: [{ canonicalName: "BoardA" }],
        layouts: [],
      },
      selectionState: { BoardA: TriState.INDETERMINATE },
      settings: { ...defaultSettings(), useThematicBoards: false },
      result: null,
      running: false,
      generate: vi.fn(),
      clearResult: vi.fn(),
    });

    await act(async () => root.render(<ResultsPanel />));

    expect(container.textContent).not.toContain(
      "Forced board selections are ignored",
    );

    await act(async () => root.unmount());
    container.remove();
  });

  it("displays a generated supporting adversary", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    useAppStateMock.mockReturnValue({
      data: { boards: [], layouts: [], adversaries: [] },
      selectionState: {},
      settings: defaultSettings(),
      result: {
        selectedSpirits: [],
        selectedBoards: [],
        selectedAdditionalBoard: null,
        additionalBoardDroppedWarning: false,
        adversary: null,
        adversaryForced: false,
        supportingAdversary: {
          name: "Russia",
          canonicalName: "Russia",
          expansion: "Base Game",
          levels: [],
        },
        supportingAdversaryForced: false,
        scenario: null,
        scenarioForced: false,
        layout: null,
        boardPositions: null,
        layoutUrlString: null,
        options: {},
        generatedAt: "2026-08-12",
      },
      running: false,
      generate: vi.fn(),
      clearResult: vi.fn(),
    });

    await act(async () => root.render(<ResultsPanel />));

    expect(container.textContent).toContain("Support Adversary:");
    expect(container.textContent).toContain("Russia");

    await act(async () => root.unmount());
    container.remove();
  });
});
