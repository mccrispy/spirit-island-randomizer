import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TriState } from "../../engine/types";
import { TriStateCheckbox, TriStateLegend } from "../TriStateCheckbox";
import { useAppState } from "../../state/AppStateContext";
import type { Adversary, Board, Scenario } from "../../data/types";
import { getExpansionIndicator } from "../../data/formatters";

export function sortAdversaries(
  adversaries: Adversary[],
  sortMode: "name" | "difficulty" = "name",
) {
  return [...adversaries].sort((a, b) => {
    if (sortMode === "difficulty") {
      const difficultyA = Math.min(
        ...a.levels.map((level) =>
          Number(
            (level as Record<string, unknown>).Difficulty ??
              Number.MAX_SAFE_INTEGER,
          ),
        ),
      );
      const difficultyB = Math.min(
        ...b.levels.map((level) =>
          Number(
            (level as Record<string, unknown>).Difficulty ??
              Number.MAX_SAFE_INTEGER,
          ),
        ),
      );
      return difficultyA - difficultyB || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
}

export function sortScenarios(scenarios: Scenario[]) {
  return [...scenarios].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortBoards(boards: Board[]) {
  return [...boards].sort((a, b) => a.name.localeCompare(b.name));
}

const BOARD_COMPATIBILITY_PAIR_CLASSES: Record<string, string> = {
  "A:H": "board-pair-ah",
  "B:E": "board-pair-be",
  "C:G": "board-pair-cg",
  "D:F": "board-pair-df",
};

export function getBoardIncompatibilityLabel(
  board: Board,
): string | null {
  if (!board.incompatibleBoards.length) return null;

  return `(no ${board.incompatibleBoards.join(", ")})`;
}

export function getBoardCompatibilityPairClass(board: Board): string | null {
  for (const incompatibleBoard of board.incompatibleBoards) {
    const pair = [board.canonicalName, incompatibleBoard]
      .sort((a, b) => a.localeCompare(b))
      .join(":");
    const pairClass = BOARD_COMPATIBILITY_PAIR_CLASSES[pair];
    if (pairClass) return pairClass;
  }
  return null;
}

export function applyBulkPoolSelection(
  selectionState: Record<string, TriState>,
  items: Array<{ canonicalName: string }>,
  targetState: TriState,
) {
  return items.reduce<Record<string, TriState>>(
    (acc, item) => {
      acc[item.canonicalName] = targetState;
      return acc;
    },
    { ...selectionState },
  );
}

interface PoolItem {
  canonicalName: string;
  name: string;
  expansion?: string;
  expansions?: string[];
  incompatibleBoards?: string[];
}

function Pool<T extends PoolItem>({
  title,
  items,
  selectionState,
  setValue,
  headerAction,
  listClassName,
  rowClassName,
  getCompatibilityLabel,
  getCompatibilityClass,
  strictCompatibility,
}: {
  title: string;
  items: T[];
  selectionState: Record<string, TriState>;
  setValue: (name: string, value: TriState) => void;
  headerAction?: ReactNode;
  listClassName?: string;
  rowClassName?: string;
  getCompatibilityLabel?: (item: T) => string | null;
  getCompatibilityClass?: (item: T) => string | null;
  strictCompatibility?: boolean;
}) {
  return (
    <section className="pool-section">
      <div className="pool-header-row">
        <h3>{title}</h3>
        {headerAction}
      </div>
      <div
        className={`pool-list compact-list${listClassName ? ` ${listClassName}` : ""}`}
      >
        {items.map((item) => {
          const expansionIndicator = getExpansionIndicator(
            item.expansions ?? item.expansion ?? [],
          );
          const compatibilityTag = getCompatibilityLabel?.(item);
          const compatibilityClass = getCompatibilityClass?.(item);
          const compatibilityTagClasses = [
            "board-incompatibility-tag",
            compatibilityClass,
            strictCompatibility ? "strict" : "relaxed",
          ]
            .filter(Boolean)
            .join(" ");
          const checkboxLabel = [
            item.name,
            expansionIndicator?.label,
            compatibilityTag,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              className={`pool-row${rowClassName ? ` ${rowClassName}` : ""}`}
              key={item.canonicalName}
            >
              <TriStateCheckbox
                label={checkboxLabel}
                value={selectionState[item.canonicalName] ?? TriState.UNCHECKED}
                onChange={(value) => setValue(item.canonicalName, value)}
              />
              <span className="pool-item-label" title={item.name}>
                <span className="pool-item-name">{item.name}</span>
                {expansionIndicator && (
                  <span
                    className="pool-expansion-indicator"
                    title={expansionIndicator.title}
                    aria-label={expansionIndicator.title}
                  >
                    {expansionIndicator.label}
                  </span>
                )}
                {compatibilityTag && (
                  <span
                    className={compatibilityTagClasses}
                    title={`Incompatible with board${item.incompatibleBoards?.length === 1 ? "" : "s"}: ${item.incompatibleBoards?.join(", ")}`}
                    aria-label={`Incompatible with board${item.incompatibleBoards?.length === 1 ? "" : "s"}: ${item.incompatibleBoards?.join(", ")}`}
                  >
                    {compatibilityTag}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function BoardsAdversariesScenariosTab() {
  const { data, selectionState, settings, setSelection } = useAppState();
  const [adversarySort, setAdversarySort] = useState<"name" | "difficulty">(
    "name",
  );

  if (!data || !selectionState || !settings) return null;
  const strictCompatibility =
    settings.strictBoardCompatibility &&
    settings.numSpirits + Number(settings.includeAdditionalBoard) < 5;

  const setValue = (name: string, value: TriState) =>
    setSelection({ ...selectionState, [name]: value });

  const sortedAdversaries = useMemo(
    () => sortAdversaries(data.adversaries, adversarySort),
    [data.adversaries, adversarySort],
  );
  const sortedScenarios = useMemo(
    () => sortScenarios(data.scenarios),
    [data.scenarios],
  );
  const sortedBoards = useMemo(() => sortBoards(data.boards), [data.boards]);
  return (
    <div className="board-pool-layout">
      <TriStateLegend compact />

      <Pool<Board>
        title="Boards"
        items={sortedBoards}
        selectionState={selectionState}
        setValue={setValue}
        listClassName="board-pool-list"
        rowClassName="compact-pool-row board-pool-row"
        getCompatibilityLabel={getBoardIncompatibilityLabel}
        getCompatibilityClass={getBoardCompatibilityPairClass}
        strictCompatibility={strictCompatibility}
        headerAction={
          <div className="pool-toolbar inline-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(
                    selectionState,
                    sortedBoards,
                    TriState.CHECKED,
                  ),
                })
              }
            >
              Select All
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(
                    selectionState,
                    sortedBoards,
                    TriState.UNCHECKED,
                  ),
                })
              }
            >
              Deselect All
            </button>
          </div>
        }
      />

      <Pool<Adversary>
        title="Adversaries"
        items={sortedAdversaries}
        selectionState={selectionState}
        setValue={setValue}
        listClassName="compact-pool-list"
        rowClassName="compact-pool-row"
        headerAction={
          <div className="pool-toolbar inline-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(
                    selectionState,
                    sortedAdversaries,
                    TriState.CHECKED,
                  ),
                })
              }
            >
              Select All
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(
                    selectionState,
                    sortedAdversaries,
                    TriState.UNCHECKED,
                  ),
                })
              }
            >
              Deselect All
            </button>
            <select
              className="sort-select"
              value={adversarySort}
              onChange={(event) =>
                setAdversarySort(event.target.value as "name" | "difficulty")
              }
            >
              <option value="name">Sort: Name</option>
              <option value="difficulty">Sort: Difficulty</option>
            </select>
          </div>
        }
      />

      <Pool<Scenario>
        title="Scenarios"
        items={sortedScenarios}
        selectionState={selectionState}
        setValue={setValue}
        listClassName="compact-pool-list"
        rowClassName="compact-pool-row"
        headerAction={
          <div className="pool-toolbar inline-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(
                    selectionState,
                    sortedScenarios,
                    TriState.CHECKED,
                  ),
                })
              }
            >
              Select All
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(
                    selectionState,
                    sortedScenarios,
                    TriState.UNCHECKED,
                  ),
                })
              }
            >
              Deselect All
            </button>
          </div>
        }
      />
    </div>
  );
}
