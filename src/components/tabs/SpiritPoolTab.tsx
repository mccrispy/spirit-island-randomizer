import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { TriState } from "../../engine/types";
import { TriStateCheckbox } from "../TriStateCheckbox";
import { useAppState } from "../../state/AppStateContext";

export function SpiritPoolTab() {
  const { data, selectionState, setSelection } = useAppState();
  if (!data || !selectionState) return null;
  const setValue = (canonicalName: string, value: TriState) =>
    setSelection({ ...selectionState, [canonicalName]: value });
  return (
    <Accordion.Root
      className="pool-list"
      type="multiple"
      defaultValue={Object.keys(data.baseSpiritMap)}
    >
      {Object.values(data.baseSpiritMap).map(({ spirit, aspects }) => (
        <Accordion.Item
          className="pool-item"
          value={spirit.canonicalName}
          key={spirit.canonicalName}
        >
          <Accordion.Header>
            <Accordion.Trigger className="pool-row family-row">
              <TriStateCheckbox
                label={spirit.name}
                value={
                  selectionState[spirit.canonicalName] ?? TriState.UNCHECKED
                }
                onChange={(value) => setValue(spirit.canonicalName, value)}
              />
              <span>{spirit.name}</span>
              <ChevronDown className="accordion-icon" size={17} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="aspect-list">
            {aspects.map((aspect) => (
              <div className="pool-row aspect-row" key={aspect.canonicalName}>
                <TriStateCheckbox
                  label={aspect.name}
                  value={
                    selectionState[aspect.canonicalName] ?? TriState.UNCHECKED
                  }
                  onChange={(value) => setValue(aspect.canonicalName, value)}
                />
                <span>{aspect.name}</span>
              </div>
            ))}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
