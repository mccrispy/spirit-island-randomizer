import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { BaseSpirit, Spirit } from "../../data/types";
import { TriState } from "../../engine/types";
import { useAppState } from "../../state/AppStateContext";
import { TriStateCheckbox } from "../TriStateCheckbox";

export interface SpiritFilterState {
  expansions: Set<string>;
  complexity: Set<string>;
  name: string;
}

export function getVisibleSpiritCollections(
  baseSpiritMap: Record<string, BaseSpirit>,
  filterState: SpiritFilterState,
): {
  visibleBaseSpirits: BaseSpirit[];
  visibleAspects: Spirit[];
} {
  const visibleBaseSpirits: BaseSpirit[] = [];
  const visibleAspects: Spirit[] = [];

  const normalizedName = filterState.name.trim().toLowerCase();

  const isVisible = (spirit: Spirit): boolean => {
    if (filterState.expansions.size > 0 && !filterState.expansions.has(spirit.expansion)) {
      return false;
    }

    const baseComplexity =
      spirit.spiritType === "Aspect"
        ? (Object.values(baseSpiritMap).find(
            ({ spirit: baseSpirit }) => baseSpirit.canonicalName === spirit.baseSpiritName,
          )?.spirit.complexityRating ?? undefined)
        : spirit.complexityRating;

    if (filterState.complexity.size > 0) {
      const complexityKey = baseComplexity ?? "?";
      if (!filterState.complexity.has(complexityKey)) {
        return false;
      }
    }

    if (normalizedName && !spirit.name.toLowerCase().includes(normalizedName)) {
      return false;
    }

    return true;
  };

  for (const baseSpirit of Object.values(baseSpiritMap).sort((a, b) =>
    a.spirit.name.localeCompare(b.spirit.name),
  )) {
    const spiritVisible = isVisible(baseSpirit.spirit);
    const matchingAspects = baseSpirit.aspects.filter((aspect) => isVisible(aspect));

    if (spiritVisible || matchingAspects.length > 0) {
      visibleBaseSpirits.push(baseSpirit);
      visibleAspects.push(...matchingAspects);
    }
  }

  return { visibleBaseSpirits, visibleAspects };
}

export function applyBulkSelection({
  selectionState,
  visibleBaseSpirits,
  visibleAspects,
  mode,
}: {
  selectionState: Record<string, TriState>;
  visibleBaseSpirits: BaseSpirit[];
  visibleAspects: Spirit[];
  mode: "base-only" | "aspects-only" | "select-all" | "deselect-all";
}): Record<string, TriState> {
  const nextSelection = { ...selectionState };

  switch (mode) {
    case "base-only": {
      for (const baseSpirit of visibleBaseSpirits) {
        nextSelection[baseSpirit.spirit.canonicalName] = TriState.CHECKED;
      }
      for (const aspect of visibleAspects) {
        nextSelection[aspect.canonicalName] = TriState.UNCHECKED;
      }
      return nextSelection;
    }
    case "aspects-only": {
      for (const baseSpirit of visibleBaseSpirits) {
        nextSelection[baseSpirit.spirit.canonicalName] = TriState.UNCHECKED;
      }
      for (const aspect of visibleAspects) {
        nextSelection[aspect.canonicalName] = TriState.CHECKED;
      }
      return nextSelection;
    }
    case "select-all": {
      for (const baseSpirit of visibleBaseSpirits) {
        nextSelection[baseSpirit.spirit.canonicalName] = TriState.CHECKED;
      }
      for (const aspect of visibleAspects) {
        nextSelection[aspect.canonicalName] = TriState.CHECKED;
      }
      return nextSelection;
    }
    case "deselect-all": {
      for (const baseSpirit of visibleBaseSpirits) {
        nextSelection[baseSpirit.spirit.canonicalName] = TriState.UNCHECKED;
      }
      for (const aspect of visibleAspects) {
        nextSelection[aspect.canonicalName] = TriState.UNCHECKED;
      }
      return nextSelection;
    }
  }
}

export function SpiritPoolTab() {
  const { data, selectionState, setSelection } = useAppState();
  const [filters, setFilters] = useState<SpiritFilterState>({
    expansions: new Set(),
    complexity: new Set(),
    name: "",
  });
  const [expandedSpiritNames, setExpandedSpiritNames] = useState<string[]>([]);

  if (!data || !selectionState) return null;

  const allExpansions = Array.from(
    new Set(
      Object.values(data.baseSpiritMap)
        .flatMap(({ spirit, aspects }) => [spirit.expansion, ...aspects.map((aspect) => aspect.expansion)]),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const allComplexities = Array.from(
    new Set(
      Object.values(data.baseSpiritMap)
        .map(({ spirit }) => spirit.complexityRating)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const visibleCollections = useMemo(
    () => getVisibleSpiritCollections(data.baseSpiritMap, filters),
    [data.baseSpiritMap, filters],
  );

  const { visibleBaseSpirits, visibleAspects } = visibleCollections;

  const setValue = (canonicalName: string, value: TriState) =>
    setSelection({ ...selectionState, [canonicalName]: value });

  const applyBulkAction = (
    mode: "base-only" | "aspects-only" | "select-all" | "deselect-all",
  ) => {
    setSelection({
      ...selectionState,
      ...applyBulkSelection({
        selectionState,
        visibleBaseSpirits,
        visibleAspects,
        mode,
      }),
    });
  };

  const clearFilters = () => {
    setFilters({ expansions: new Set(), complexity: new Set(), name: "" });
  };

  const hasFilters =
    filters.expansions.size > 0 ||
    filters.complexity.size > 0 ||
    filters.name.trim().length > 0;

  const toggleAllTree = () => {
    if (expandedSpiritNames.length === 0) {
      setExpandedSpiritNames(Object.keys(data.baseSpiritMap));
      return;
    }
    setExpandedSpiritNames([]);
  };

  return (
    <div>
      <div className="spirit-filter-row">
        <div className="filter-group">
          <span className="filter-label">Expansion</span>
          <div className="pill-group">
            {allExpansions.map((expansion) => {
              const active = filters.expansions.has(expansion);
              return (
                <button
                  key={expansion}
                  type="button"
                  className={`filter-pill ${active ? "active" : ""}`}
                  onClick={() => {
                    setFilters((current) => {
                      const next = new Set(current.expansions);
                      if (next.has(expansion)) next.delete(expansion);
                      else next.add(expansion);
                      return { ...current, expansions: next };
                    });
                  }}
                >
                  {expansion}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Complexity</span>
          <div className="pill-group">
            {allComplexities.map((complexity) => {
              const active = filters.complexity.has(complexity);
              return (
                <button
                  key={complexity}
                  type="button"
                  className={`filter-pill ${active ? "active" : ""}`}
                  onClick={() => {
                    setFilters((current) => {
                      const next = new Set(current.complexity);
                      if (next.has(complexity)) next.delete(complexity);
                      else next.add(complexity);
                      return { ...current, complexity: next };
                    });
                  }}
                >
                  {complexity}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-group name-filter-group">
          <span className="filter-label">Name</span>
          <input
            value={filters.name}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Search spirits"
            className="name-filter-input"
          />
        </div>

        <button
          type="button"
          className="toolbar-button secondary"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          Clear All Filters
        </button>
      </div>

      <div className="spirit-toolbar">
        <button type="button" className="toolbar-button" onClick={toggleAllTree}>
          {expandedSpiritNames.length === 0 ? "Expand All" : "Collapse All"}
        </button>
        <button type="button" className="toolbar-button" onClick={() => applyBulkAction("base-only")}>
          Base Only
        </button>
        <button type="button" className="toolbar-button" onClick={() => applyBulkAction("aspects-only")}>
          Aspects Only
        </button>
        <button type="button" className="toolbar-button" onClick={() => applyBulkAction("select-all")}>
          Select All
        </button>
        <button type="button" className="toolbar-button" onClick={() => applyBulkAction("deselect-all")}>
          Deselect All
        </button>
      </div>

      <Accordion.Root
        className="pool-list"
        type="multiple"
        value={expandedSpiritNames}
        onValueChange={setExpandedSpiritNames}
      >
        {visibleBaseSpirits.map(({ spirit, aspects }) => (
          <Accordion.Item
            className="pool-item"
            value={spirit.canonicalName}
            key={spirit.canonicalName}
          >
            <Accordion.Header>
              <Accordion.Trigger className="pool-row family-row">
                <TriStateCheckbox
                  label={spirit.name}
                  value={selectionState[spirit.canonicalName] ?? TriState.UNCHECKED}
                  onChange={(value) => setValue(spirit.canonicalName, value)}
                />
                <span>{spirit.name}</span>
                <ChevronDown className="accordion-icon" size={17} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="aspect-list">
              {aspects
                .filter((aspect) => visibleAspects.some((visibleAspect) => visibleAspect.canonicalName === aspect.canonicalName))
                .map((aspect) => (
                  <div className="pool-row aspect-row" key={aspect.canonicalName}>
                    <TriStateCheckbox
                      label={aspect.name}
                      value={selectionState[aspect.canonicalName] ?? TriState.UNCHECKED}
                      onChange={(value) => setValue(aspect.canonicalName, value)}
                    />
                    <span>{aspect.name}</span>
                  </div>
                ))}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
