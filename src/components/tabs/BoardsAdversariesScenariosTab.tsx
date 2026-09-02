import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TriState } from "../../engine/types";
import { TriStateCheckbox } from "../TriStateCheckbox";
import { useAppState } from "../../state/AppStateContext";
import type { Adversary, Board, Scenario } from "../../data/types";

export function sortAdversaries(adversaries: Adversary[], sortMode: "name" | "difficulty" = "name") {
  return [...adversaries].sort((a, b) => {
    if (sortMode === "difficulty") {
      const difficultyA = Math.min(
        ...a.levels.map((level) => Number((level as Record<string, unknown>).Difficulty ?? Number.MAX_SAFE_INTEGER)),
      );
      const difficultyB = Math.min(
        ...b.levels.map((level) => Number((level as Record<string, unknown>).Difficulty ?? Number.MAX_SAFE_INTEGER)),
      );
      return difficultyA - difficultyB || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
}

export function sortScenarios(scenarios: Scenario[]) {
  return [...scenarios].sort((a, b) => a.name.localeCompare(b.name));
}

export function applyBulkPoolSelection(
  selectionState: Record<string, TriState>,
  items: Array<{ canonicalName: string }>,
  targetState: TriState,
) {
  return items.reduce<Record<string, TriState>>((acc, item) => {
    acc[item.canonicalName] = targetState;
    return acc;
  }, { ...selectionState });
}

function Pool<T extends { canonicalName: string; name: string }>({
  title,
  items,
  selectionState,
  setValue,
  headerAction,
}: {
  title: string;
  items: T[];
  selectionState: Record<string, TriState>;
  setValue: (name: string, value: TriState) => void;
  headerAction?: ReactNode;
}) {
  return (
    <section className="pool-section">
      <div className="pool-header-row">
        <h3>{title}</h3>
        {headerAction}
      </div>
      <div className="pool-list compact-list">
        {items.map((item) => (
          <div className="pool-row" key={item.canonicalName}>
            <TriStateCheckbox
              label={item.name}
              value={selectionState[item.canonicalName] ?? TriState.UNCHECKED}
              onChange={(value) => setValue(item.canonicalName, value)}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BoardsAdversariesScenariosTab() {
  const { data, selectionState, setSelection } = useAppState();
  const [adversarySort, setAdversarySort] = useState<"name" | "difficulty">("name");

  if (!data || !selectionState) return null;

  const setValue = (name: string, value: TriState) =>
    setSelection({ ...selectionState, [name]: value });

  const sortedAdversaries = useMemo(
    () => sortAdversaries(data.adversaries, adversarySort),
    [data.adversaries, adversarySort],
  );
  const sortedScenarios = useMemo(() => sortScenarios(data.scenarios), [data.scenarios]);

  return (
    <div className="board-pool-layout">
      <Pool<Board>
        title="Boards"
        items={data.boards}
        selectionState={selectionState}
        setValue={setValue}
        headerAction={
          <div className="pool-toolbar inline-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(selectionState, data.boards, TriState.CHECKED),
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
                  ...applyBulkPoolSelection(selectionState, data.boards, TriState.UNCHECKED),
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
        headerAction={
          <div className="pool-toolbar inline-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(selectionState, sortedAdversaries, TriState.CHECKED),
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
                  ...applyBulkPoolSelection(selectionState, sortedAdversaries, TriState.UNCHECKED),
                })
              }
            >
              Deselect All
            </button>
            <select
              className="sort-select"
              value={adversarySort}
              onChange={(event) => setAdversarySort(event.target.value as "name" | "difficulty")}
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
        headerAction={
          <div className="pool-toolbar inline-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() =>
                setSelection({
                  ...selectionState,
                  ...applyBulkPoolSelection(selectionState, sortedScenarios, TriState.CHECKED),
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
                  ...applyBulkPoolSelection(selectionState, sortedScenarios, TriState.UNCHECKED),
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
