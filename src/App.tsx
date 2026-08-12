import { useEffect, useState } from "react";
import { loadAllData } from "./data/loader";
import type { AppData } from "./data/types";
import { generateSetup, createSeededRng } from "./engine/randomizer";
import type { EngineResult, SelectionState } from "./engine/types";
import { buildWebLaunchUrl, buildSteamLaunchUrl } from "./launchUrl";
import {
  buildDefaultSelectionState,
  defaultSettings,
  loadSelectionState,
  loadSettingsState,
  saveSelectionState,
  saveSettingsState,
  settingsToExpansions,
} from "./persistence";
import type { SettingsState } from "./persistence";

function formatSelectedSpiritLabel(
  selectedSpirit: EngineResult["selectedSpirits"][number],
): string {
  if (selectedSpirit.aspect) {
    return `${selectedSpirit.spirit.name} (${selectedSpirit.aspect.name} aspect)`;
  }

  if (selectedSpirit.spirit.spiritType === "Aspect") {
    const baseSpiritName =
      selectedSpirit.spirit.baseSpiritName ?? "Unknown Base Spirit";
    return `${baseSpiritName} (${selectedSpirit.spirit.name} aspect)`;
  }

  return selectedSpirit.spirit.name;
}

function formatSelectedBoardLabel(
  selectedBoard: EngineResult["selectedBoards"][number],
): string {
  return `${selectedBoard.board.name} (${selectedBoard.boardSide.identifier})`;
}

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [selectionState, setSelectionState] = useState<SelectionState | null>(
    null,
  );
  const [settings, setSettings] = useState<SettingsState | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadAllData();
        setData(loaded);

        const savedSelection = loadSelectionState();
        const savedSettings = loadSettingsState();

        const activeSelection =
          savedSelection ?? buildDefaultSelectionState(loaded);
        const activeSettings = savedSettings ?? defaultSettings();

        if (!savedSelection) saveSelectionState(activeSelection);
        if (!savedSettings) saveSettingsState(activeSettings);

        setSelectionState(activeSelection);
        setSettings(activeSettings);
      } catch (err) {
        setError(`Failed to load game data: ${err}`);
      }
    }
    load();
  }, []);

  function generate() {
    if (!data || !selectionState || !settings) {
      setError("Data not loaded yet.");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const options = {
        ...settings,
        expansions: settingsToExpansions(settings),
        selectionState,
      };
      const rng = createSeededRng((Math.random() * 0x100000000) >>> 0);
      const res = generateSetup(data, options, rng);
      setResult(res);
    } catch (err) {
      setError(String(err));
      setResult(null);
    } finally {
      setRunning(false);
    }
  }

  if (error) {
    return (
      <div className="app-shell">
        <h1>SIRPY Web</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-shell">
        <h1>SIRPY Web</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <h1>SIRPY Web</h1>
        <p>Spirit Island randomizer port for GitHub Pages.</p>
      </header>

      <main>
        <section className="hero">
          <p>
            Data loaded: {data.spirits.length} base spirits,{" "}
            {data.aspects.length} aspects, {data.boards.length} boards,{" "}
            {data.adversaries.length} adversaries, {data.scenarios.length}{" "}
            scenarios.
          </p>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={generate}
              disabled={running || !selectionState || !settings}
            >
              {running ? "Generating..." : "Generate"}
            </button>
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          {result ? (
            <div>
              <h2>Engine Result</h2>
              <p>Generated at: {result.generatedAt}</p>
              <ul>
                <li>
                  Assignments:{" "}
                  {result.selectedSpirits
                    .map((selectedSpirit, index) => {
                      const selectedBoard = result.selectedBoards[index];
                      if (!selectedBoard) {
                        return `${index + 1}. ${formatSelectedSpiritLabel(selectedSpirit)} (no board)`;
                      }
                      return `${index + 1}. ${formatSelectedSpiritLabel(selectedSpirit)} on ${formatSelectedBoardLabel(selectedBoard)}`;
                    })
                    .join(" | ")}
                </li>
                <li>
                  Boards:{" "}
                  {result.selectedBoards
                    .map((b) => formatSelectedBoardLabel(b))
                    .join(", ")}
                  {result.selectedAdditionalBoard
                    ? ` + Additional: ${result.selectedAdditionalBoard.board.name} (${result.selectedAdditionalBoard.boardSide.identifier})`
                    : ""}
                </li>
                <li>
                  Spirits:{" "}
                  {result.selectedSpirits
                    .map((s) => formatSelectedSpiritLabel(s))
                    .join(", ")}
                </li>
                <li>
                  Adversary:{" "}
                  {result.adversary?.name ??
                    (result.options.useAdversaries === false
                      ? "Disabled"
                      : "None")}
                </li>
                <li>
                  Scenario:{" "}
                  {result.scenario?.name ??
                    (result.options.useScenarios === false
                      ? "Disabled"
                      : "None")}
                </li>
              </ul>
              <div style={{ marginTop: 12 }}>
                {[
                  {
                    label: "Web Launch",
                    url: buildWebLaunchUrl(result, settings!),
                  },
                  {
                    label: "Steam Launch",
                    url: buildSteamLaunchUrl(result, settings!),
                  },
                ].map(({ label, url }) => (
                  <p key={label} style={{ wordBreak: "break-all" }}>
                    <a href={url} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                    {": "}
                    <code style={{ fontSize: "0.85em" }}>{url}</code>
                  </p>
                ))}
              </div>
              <pre
                style={{
                  maxHeight: 400,
                  overflow: "auto",
                  background: "#f6f8fa",
                  padding: 12,
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <h2>No result yet</h2>
              <p>
                Click "Generate" to run the engine with the current selection
                and settings.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
