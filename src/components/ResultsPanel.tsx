import type { AppData } from "../data/types";
import type { SelectedBoard, SelectedSpirit } from "../engine/types";
import { buildSteamLaunchUrl, buildWebLaunchUrl } from "../launchUrl";
import { LayoutDisplay } from "./LayoutDisplay";
import { useAppState } from "../state/AppStateContext";

const EXPANSION_ABBREVIATIONS: Record<string, string> = {
  "Base Game": "BG",
  "Branch & Claw": "BC",
  "Feather & Flame": "FF",
  "Horizons of Spirit Island": "Ho",
  "Jagged Earth": "JE",
  "Nature Incarnate": "NI",
};

function abbr(expansion: string): string {
  return EXPANSION_ABBREVIATIONS[expansion] ?? expansion;
}

// PRM parity: aspects show "BaseSpirit (Complexity) - AspectName (Modifier) [Exp]"; base spirits show "Name (Complexity) [Exp]".
function formatSpiritLabel(item: SelectedSpirit, data: AppData): string {
  const { spirit } = item;
  if (spirit.spiritType === "Aspect") {
    const baseSpirit = data.baseSpiritMap[spirit.baseSpiritName ?? ""]?.spirit;
    const baseName =
      baseSpirit?.name ?? spirit.baseSpiritName ?? "Unknown Base Spirit";
    const complexity = baseSpirit?.complexityRating;
    const modifier = spirit.complexityModifier;
    return `${baseName}${complexity ? ` (${complexity})` : ""} - ${spirit.name}${modifier ? ` (${modifier})` : ""} Aspect [${abbr(spirit.expansion)}]`;
  }
  return `${spirit.name}${spirit.complexityRating ? ` (${spirit.complexityRating})` : ""} [${abbr(spirit.expansion)}]`;
}

// PRM parity: standard-side boards show the board name; thematic-side boards show the side identifier instead (avoids "A (A)" redundancy).
function formatBoardLabel(selectedBoard: SelectedBoard): string {
  const isThematic = selectedBoard.boardSide.sideType
    .toLowerCase()
    .includes("thematic");
  return isThematic
    ? selectedBoard.boardSide.identifier
    : selectedBoard.board.name;
}

// Maps board canonicalName -> its 1-based layout position, matching the numbered slots drawn on the layout SVG.
function buildBoardPositionMap(
  boardPositions: Record<number, { canonicalName: string }> | null | undefined,
) {
  const map: Record<string, number> = {};
  if (boardPositions) {
    for (const [position, board] of Object.entries(boardPositions)) {
      map[board.canonicalName] = Number(position);
    }
  }
  return map;
}

export function ResultsPanel() {
  const { data, result, settings } = useAppState();

  // PRM parity: before Generate is pressed, preview the currently selected layout for the current board count.
  const previewTotalBoards = settings
    ? settings.numSpirits + (settings.includeAdditionalBoard ? 1 : 0)
    : 0;
  const preferredLayoutName =
    settings?.preferredLayouts[String(previewTotalBoards)];
  const previewLayout = preferredLayoutName
    ? (data?.layouts.find(
        (layout) => layout.canonicalName === preferredLayoutName,
      ) ?? null)
    : null;

  return (
    <aside className="results-panel">
      <div className="panel-heading">
        <h2>Results</h2>
        <span>{result ? "Ready" : "Waiting"}</span>
      </div>
      {result && settings && data ? (
        <>
          <h3>Spirits &amp; Boards</h3>
          {/* PRM parity: layout SVGs number board slots 1..N; show that same number here (not shown in
              thematic mode, where the board name itself is already the directional slot identifier). */}
          {(() => {
            const showPositions =
              !settings.useThematicBoards && Boolean(result.boardPositions);
            const positionByBoard = showPositions
              ? buildBoardPositionMap(result.boardPositions)
              : {};
            return (
              <>
                <ol>
                  {result.selectedSpirits.map((selectedSpirit, index) => {
                    const selectedBoard = result.selectedBoards[index];
                    const position = selectedBoard
                      ? positionByBoard[selectedBoard.board.canonicalName]
                      : undefined;
                    return (
                      <li key={selectedSpirit.spirit.canonicalName}>
                        <span
                          className={
                            selectedSpirit.forced ? "forced" : undefined
                          }
                        >
                          {formatSpiritLabel(selectedSpirit, data)}
                        </span>
                        {selectedBoard ? (
                          <>
                            {" on "}
                            <span
                              className={
                                selectedBoard.forced ? "forced" : undefined
                              }
                            >
                              {formatBoardLabel(selectedBoard)}
                            </span>
                            {position !== undefined && (
                              <span className="position-badge">
                                Position {position}
                              </span>
                            )}
                          </>
                        ) : (
                          " (no board)"
                        )}
                      </li>
                    );
                  })}
                </ol>

                {result.layout && (
                  <p className="result-line">
                    <strong>Layout:</strong> {result.layout.name}
                  </p>
                )}

                <LayoutDisplay
                  layout={result.layout}
                  totalBoards={
                    result.selectedBoards.length +
                    (result.selectedAdditionalBoard ? 1 : 0)
                  }
                  useThematicBoards={settings.useThematicBoards}
                />

                {result.selectedAdditionalBoard && (
                  <p className="result-line">
                    <strong>Additional Board:</strong>{" "}
                    <span
                      className={
                        result.selectedAdditionalBoard.forced
                          ? "forced"
                          : undefined
                      }
                    >
                      {formatBoardLabel(result.selectedAdditionalBoard)}
                    </span>
                    {positionByBoard[
                      result.selectedAdditionalBoard.board.canonicalName
                    ] !== undefined && (
                      <span className="position-badge">
                        Position{" "}
                        {
                          positionByBoard[
                            result.selectedAdditionalBoard.board.canonicalName
                          ]
                        }
                      </span>
                    )}
                  </p>
                )}
              </>
            );
          })()}

          {result.additionalBoardDroppedWarning && (
            <p className="result-line warning-line">
              ⚠ The additional board was dropped — thematic mode supports a
              maximum of 6 boards total. Disable Thematic Boards or reduce
              spirits to include it.
            </p>
          )}

          <p className="result-line">
            <strong>Adversary:</strong>{" "}
            {result.adversary ? (
              <span className={result.adversaryForced ? "forced" : undefined}>
                {result.adversary.name} [{abbr(result.adversary.expansion)}]
              </span>
            ) : result.options.useAdversaries === false ? (
              "Disabled"
            ) : (
              "None"
            )}
          </p>
          <p className="result-line">
            <strong>Scenario:</strong>{" "}
            {result.scenario ? (
              <span className={result.scenarioForced ? "forced" : undefined}>
                {result.scenario.name} [{abbr(result.scenario.expansion)}]
              </span>
            ) : result.options.useScenarios === false ? (
              "Disabled"
            ) : (
              "None"
            )}
          </p>

          <div className="launch-links">
            <a
              href={buildWebLaunchUrl(result, settings)}
              target="_blank"
              rel="noreferrer"
            >
              Web launch
            </a>
            <a
              href={buildSteamLaunchUrl(result, settings)}
              target="_blank"
              rel="noreferrer"
            >
              Steam launch
            </a>
          </div>
        </>
      ) : settings && data ? (
        <>
          <p>Generate a setup to see it here.</p>
          <LayoutDisplay
            layout={previewLayout}
            totalBoards={previewTotalBoards}
            useThematicBoards={settings.useThematicBoards}
            showPlaceholderWhenNoLayout
          />
        </>
      ) : (
        <p>Generate a setup to see it here.</p>
      )}
    </aside>
  );
}
