import { TriState } from "../../engine/types";
import { TriStateCheckbox } from "../TriStateCheckbox";
import { useAppState } from "../../state/AppStateContext";
import type { Adversary, Board, Scenario } from "../../data/types";

function Pool<T extends { canonicalName: string; name: string }>({
  title,
  items,
  selectionState,
  setValue,
}: {
  title: string;
  items: T[];
  selectionState: Record<string, TriState>;
  setValue: (name: string, value: TriState) => void;
}) {
  return (
    <section className="pool-section">
      <h3>{title}</h3>
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
    </section>
  );
}

export function BoardsAdversariesScenariosTab() {
  const { data, selectionState, setSelection } = useAppState();
  if (!data || !selectionState) return null;
  const setValue = (name: string, value: TriState) =>
    setSelection({ ...selectionState, [name]: value });
  return (
    <div>
      <Pool<Board>
        title="Boards"
        items={data.boards}
        selectionState={selectionState}
        setValue={setValue}
      />
      <Pool<Adversary>
        title="Adversaries"
        items={data.adversaries}
        selectionState={selectionState}
        setValue={setValue}
      />
      <Pool<Scenario>
        title="Scenarios"
        items={data.scenarios}
        selectionState={selectionState}
        setValue={setValue}
      />
    </div>
  );
}
