import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { BaseSpirit, Spirit } from "../../data/types";
import { TriState } from "../../engine/types";
import { useAppState } from "../../state/AppStateContext";
import {
  TriStateCheckbox,
  TriStateIcon,
  TriStateLegend,
} from "../TriStateCheckbox";

export interface SpiritFilterState {
  expansions: Set<string>;
  complexity: Set<string>;
  name: string;
}

export function getVisibleSpiritCollections(
  baseSpiritMap: Record<string, BaseSpirit>,
  filterState: SpiritFilterState,
): {
  displayedBaseSpirits: BaseSpirit[];
  visibleBaseSpirits: BaseSpirit[];
  visibleAspects: Spirit[];
} {
  const displayedBaseSpirits: BaseSpirit[] = [];
  const visibleBaseSpirits: BaseSpirit[] = [];
  const visibleAspects: Spirit[] = [];

  const normalizedName = filterState.name.trim().toLowerCase();

  const isVisible = (spirit: Spirit): boolean => {
    if (
      filterState.expansions.size > 0 &&
      !filterState.expansions.has(spirit.expansion)
    ) {
      return false;
    }

    const baseComplexity =
      spirit.spiritType === "Aspect"
        ? (Object.values(baseSpiritMap).find(
            ({ spirit: baseSpirit }) =>
              baseSpirit.canonicalName === spirit.baseSpiritName,
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
    const matchingAspects = baseSpirit.aspects.filter((aspect) =>
      isVisible(aspect),
    );

    if (spiritVisible || matchingAspects.length > 0) {
      displayedBaseSpirits.push(baseSpirit);
      if (spiritVisible) visibleBaseSpirits.push(baseSpirit);
      visibleAspects.push(...matchingAspects);
    }
  }

  return { displayedBaseSpirits, visibleBaseSpirits, visibleAspects };
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

export function getAspectSelectionSummary(
  aspects: Spirit[],
  selectionState: Record<string, TriState>,
): { inPool: number; forced: number } {
  return aspects.reduce(
    (summary, aspect) => {
      const state = selectionState[aspect.canonicalName] ?? TriState.UNCHECKED;
      if (state === TriState.CHECKED || state === TriState.INDETERMINATE) {
        summary.inPool += 1;
      }
      if (state === TriState.INDETERMINATE) summary.forced += 1;
      return summary;
    },
    { inPool: 0, forced: 0 },
  );
}

export function SpiritPoolTab() {
  const { data, selectionState, setSelection } = useAppState();
  const [filters, setFilters] = useState<SpiritFilterState>({
    expansions: new Set(),
    complexity: new Set(),
    name: "",
  });
  const [expandedSpiritNames, setExpandedSpiritNames] = useState<string[]>([]);
  const [forceUpdateMessage, setForceUpdateMessage] = useState("");

  if (!data || !selectionState) return null;

  const allExpansions = Array.from(
    new Set(
      Object.values(data.baseSpiritMap).flatMap(({ spirit, aspects }) => [
        spirit.expansion,
        ...aspects.map((aspect) => aspect.expansion),
      ]),
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

  const { displayedBaseSpirits, visibleBaseSpirits, visibleAspects } =
    visibleCollections;
  const visibleCount = visibleBaseSpirits.length + visibleAspects.length;

  const setValue = (canonicalName: string, value: TriState) => {
    const family = Object.values(data.baseSpiritMap).find(
      ({ spirit, aspects }) =>
        spirit.canonicalName === canonicalName ||
        aspects.some((aspect) => aspect.canonicalName === canonicalName),
    );
    const displacedForcedMembers =
      value === TriState.INDETERMINATE && family
        ? [family.spirit, ...family.aspects].filter(
            ({ canonicalName: memberName }) =>
              memberName !== canonicalName &&
              selectionState[memberName] === TriState.INDETERMINATE,
          )
        : [];

    setForceUpdateMessage(
      displacedForcedMembers.length > 0
        ? `Forcing this item moved ${displacedForcedMembers
            .map(({ name }) => name)
            .join(", ")} to In Pool. Only one item in a spirit family can be forced.`
        : "",
    );
    setSelection(
      { ...selectionState, [canonicalName]: value },
      value === TriState.INDETERMINATE ? canonicalName : undefined,
    );
  };

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
    <div className="spirit-tab-shell">
      <div className="spirit-control-grid">
        <div className="spirit-control-block">
          <div className="block-header-row">
            <h3>Filter spirits</h3>
            {hasFilters && (
              <span className="filter-badge">
                {[...filters.expansions, ...filters.complexity].length +
                  (filters.name.trim() ? 1 : 0)}{" "}
                active
              </span>
            )}
          </div>
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
              Clear filters
            </button>
          </div>
        </div>

        <div className="spirit-control-block compact">
          <div className="block-header-row">
            <h3>Quick picks</h3>
          </div>
          <p className="quick-picks-description">
            Actions affect only spirits and aspects matching the current
            filters. A base spirit shown only as an aspect&rsquo;s container is
            left unchanged.
          </p>
          <div className="spirit-toolbar compact-toolbar">
            <button
              type="button"
              className="toolbar-button"
              onClick={() => applyBulkAction("base-only")}
            >
              Base spirits only
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={() => applyBulkAction("aspects-only")}
            >
              Aspects only
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={() => applyBulkAction("select-all")}
            >
              Select matching
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={() => applyBulkAction("deselect-all")}
            >
              Deselect matching
            </button>
          </div>
        </div>
      </div>

      <TriStateLegend />
      {forceUpdateMessage && (
        <p className="force-update-message" role="status">
          {forceUpdateMessage}
        </p>
      )}

      <div className="visible-list-row">
        <span>
          Matching items: <strong>{visibleCount}</strong> spirits/aspects
        </span>
        <button
          type="button"
          className="toolbar-button"
          onClick={toggleAllTree}
        >
          {expandedSpiritNames.length === 0 ? "Expand all" : "Collapse all"}
        </button>
      </div>

      <Accordion.Root
        className="pool-list"
        type="multiple"
        value={expandedSpiritNames}
        onValueChange={setExpandedSpiritNames}
      >
        {displayedBaseSpirits.map(({ spirit, aspects }) => {
          const aspectSummary = getAspectSelectionSummary(
            aspects,
            selectionState,
          );
          const activeAspectCount = aspectSummary.inPool;
          return (
            <Accordion.Item
              className="pool-item"
              value={spirit.canonicalName}
              key={spirit.canonicalName}
            >
              <Accordion.Header className="pool-row">
                <TriStateCheckbox
                  label={spirit.name}
                  value={
                    selectionState[spirit.canonicalName] ?? TriState.UNCHECKED
                  }
                  onChange={(value) => setValue(spirit.canonicalName, value)}
                />
                <Accordion.Trigger className="family-row">
                  <span className="family-name">{spirit.name}</span>
                  {activeAspectCount > 0 && (
                    <span
                      className="aspect-status-summary"
                      role="img"
                      aria-label={`${aspectSummary.inPool} aspects in pool, including ${aspectSummary.forced} forced`}
                    >
                      {aspectSummary.inPool > 0 && (
                        <span className="aspect-status-count in-pool">
                          <span>Aspects:</span>
                          <TriStateIcon value={TriState.CHECKED} size={12} />
                          {aspectSummary.inPool} in pool
                        </span>
                      )}
                      {aspectSummary.forced > 0 && (
                        <span className="aspect-status-count forced">
                          <TriStateIcon
                            value={TriState.INDETERMINATE}
                            size={12}
                          />
                          {aspectSummary.forced} forced
                        </span>
                      )}
                    </span>
                  )}
                  <ChevronDown className="accordion-icon" size={17} />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="aspect-list">
                {aspects
                  .filter((aspect) =>
                    visibleAspects.some(
                      (visibleAspect) =>
                        visibleAspect.canonicalName === aspect.canonicalName,
                    ),
                  )
                  .map((aspect) => (
                    <div
                      className="pool-row aspect-row"
                      key={aspect.canonicalName}
                    >
                      <TriStateCheckbox
                        label={aspect.name}
                        value={
                          selectionState[aspect.canonicalName] ??
                          TriState.UNCHECKED
                        }
                        onChange={(value) =>
                          setValue(aspect.canonicalName, value)
                        }
                      />
                      <span>{aspect.name}</span>
                    </div>
                  ))}
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </div>
  );
}
