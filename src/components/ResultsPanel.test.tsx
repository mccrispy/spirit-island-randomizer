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
});
