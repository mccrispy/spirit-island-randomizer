import * as Slider from "@radix-ui/react-slider";
import { useEffect, useRef } from "react";
import { useAppState } from "../state/AppStateContext";
import type { SettingsState } from "../persistence";

export const RANDOM_LAYOUT = "__random__";

export function getBoardCountFavouriteLayout(
  preferredLayouts: Record<string, string>,
  boardCount: number,
): string {
  return preferredLayouts[String(boardCount)] ?? "";
}

export function getBoardCountSelectedLayout(
  selectedLayouts: Record<string, string>,
  preferredLayouts: Record<string, string>,
  boardCount: number,
  excludedLayouts: string[] = [],
): string {
  const key = String(boardCount);
  const selectedLayout = selectedLayouts[key];
  if (selectedLayout !== undefined) {
    return selectedLayout === RANDOM_LAYOUT ? "" : selectedLayout;
  }
  const favourite = getBoardCountFavouriteLayout(preferredLayouts, boardCount);
  return favourite === RANDOM_LAYOUT || excludedLayouts.includes(favourite)
    ? ""
    : favourite;
}

export function isFavouriteLayoutSelection(
  selectedLayout: string,
  preferredLayouts: Record<string, string>,
  boardCount: number,
  excludedLayouts: string[] = [],
): boolean {
  const favourite = getBoardCountFavouriteLayout(preferredLayouts, boardCount);
  if (
    boardCount === 1 &&
    favourite === RANDOM_LAYOUT &&
    selectedLayout &&
    !excludedLayouts.includes(selectedLayout)
  ) {
    return true;
  }
  return (
    !excludedLayouts.includes(favourite) &&
    (selectedLayout || RANDOM_LAYOUT) === favourite
  );
}

export function getLayoutSelectorValue(
  boardCount: number,
  selectedLayout: string,
  availableLayoutNames: string[],
  excludedLayoutNames: string[] = [],
): string {
  if (availableLayoutNames.includes(selectedLayout)) return selectedLayout;
  if (boardCount === 1 && availableLayoutNames.length === 1) {
    return availableLayoutNames[0];
  }
  const eligibleLayoutNames = availableLayoutNames.filter(
    (name) => !excludedLayoutNames.includes(name),
  );
  return eligibleLayoutNames.length === 0
    ? (availableLayoutNames[0] ?? "")
    : "";
}

export function canExcludeLayout(
  isExcluded: boolean,
  eligibleLayoutCount: number,
): boolean {
  return isExcluded || eligibleLayoutCount > 1;
}

export function canFavouriteLayout(
  boardCount: number,
  selectedLayout: string,
  availableLayoutCount: number,
  useThematicBoards: boolean,
): boolean {
  return (
    !useThematicBoards &&
    availableLayoutCount > 0 &&
    (Boolean(selectedLayout) || boardCount > 1)
  );
}

export function setFavouriteLayoutForBoardCount(
  settings: SettingsState,
  boardCount: number,
  layoutCanonicalName: string | null,
): SettingsState {
  const key = String(boardCount);
  const preferredLayouts = { ...settings.preferredLayouts };
  const excludedLayouts = {
    ...settings.excludedLayouts,
    [key]: [...(settings.excludedLayouts[key] ?? [])],
  };

  if (layoutCanonicalName === null) {
    delete preferredLayouts[key];
  } else {
    preferredLayouts[key] = layoutCanonicalName;
    const boardExclusions = excludedLayouts[key];
    excludedLayouts[key] = boardExclusions.filter(
      (name) => name !== layoutCanonicalName,
    );
    if (excludedLayouts[key].length === 0) {
      delete excludedLayouts[key];
    }
  }

  return { ...settings, preferredLayouts, excludedLayouts };
}

export function setLayoutExcludedForBoardCount(
  settings: SettingsState,
  boardCount: number,
  layoutCanonicalName: string,
  excluded: boolean,
): SettingsState {
  const key = String(boardCount);
  const current = settings.excludedLayouts[key] ?? [];
  const excludedLayouts = excluded
    ? [...new Set([...current, layoutCanonicalName])]
    : current.filter((name) => name !== layoutCanonicalName);
  const preferredLayouts = { ...settings.preferredLayouts };

  if (excluded && preferredLayouts[key] === layoutCanonicalName) {
    delete preferredLayouts[key];
  }

  return {
    ...settings,
    preferredLayouts,
    excludedLayouts: { ...settings.excludedLayouts, [key]: excludedLayouts },
  };
}

export function withFavouriteLayoutForBoardCount(
  settings: SettingsState,
  boardCount: number,
): SettingsState {
  return {
    ...settings,
    selectedLayouts: {
      ...settings.selectedLayouts,
      [String(boardCount)]: getBoardCountSelectedLayout(
        {},
        settings.preferredLayouts,
        boardCount,
        settings.excludedLayouts[String(boardCount)] ?? [],
      ),
    },
  };
}

export function OptionsPanel() {
  const { data, settings, setSettings } = useAppState();
  const savedStrictCompatibilityRef = useRef<boolean | null>(null);
  const totalBoards = settings
    ? settings.numSpirits + (settings.includeAdditionalBoard ? 1 : 0)
    : 0;
  const strictDisabledByBoardCount = totalBoards >= 5;

  useEffect(() => {
    if (!settings) return;
    if (strictDisabledByBoardCount && settings.strictBoardCompatibility) {
      savedStrictCompatibilityRef.current = true;
      setSettings({ ...settings, strictBoardCompatibility: false });
    } else if (
      !strictDisabledByBoardCount &&
      savedStrictCompatibilityRef.current !== null
    ) {
      const saved = savedStrictCompatibilityRef.current;
      savedStrictCompatibilityRef.current = null;
      setSettings({ ...settings, strictBoardCompatibility: saved });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalBoards, strictDisabledByBoardCount]);

  if (!settings || !data) return null;
  const toggle = (key: keyof SettingsState) =>
    setSettings({ ...settings, [key]: !settings[key] });

  const toggleExpansion = (
    key:
      | "expansionBranchClaw"
      | "expansionJaggedEarth"
      | "expansionNatureIncarnate",
  ) => {
    const updated: SettingsState = { ...settings, [key]: !settings[key] };
    if (key === "expansionJaggedEarth" && !updated.expansionJaggedEarth) {
      updated.expansionNatureIncarnate = false;
    }
    const anyExpansion =
      updated.expansionBranchClaw ||
      updated.expansionJaggedEarth ||
      updated.expansionNatureIncarnate;
    if (!anyExpansion) updated.useEvents = false;
    setSettings(updated);
  };

  const anyExpansion =
    settings.expansionBranchClaw ||
    settings.expansionJaggedEarth ||
    settings.expansionNatureIncarnate;

  const boardCount =
    settings.numSpirits + (settings.includeAdditionalBoard ? 1 : 0);
  const excludedLayouts =
    settings.excludedLayouts[String(boardCount)] ?? [];
  const favouriteLayoutForBoardCount = getBoardCountFavouriteLayout(
    settings.preferredLayouts,
    boardCount,
  );
  const selectedLayoutForBoardCount = getBoardCountSelectedLayout(
    settings.selectedLayouts,
    settings.preferredLayouts,
    boardCount,
    excludedLayouts,
  );
  const availableLayouts = data.layouts.filter((layout) =>
    layout.validBoardCounts.includes(boardCount),
  );
  const eligibleLayouts = availableLayouts.filter(
    (layout) => !excludedLayouts.includes(layout.canonicalName),
  );
  const layoutSelectorValue = getLayoutSelectorValue(
    boardCount,
    selectedLayoutForBoardCount,
    availableLayouts.map((layout) => layout.canonicalName),
    excludedLayouts,
  );
  const selectedLayoutName =
    availableLayouts.find(
      (layout) => layout.canonicalName === layoutSelectorValue,
    )?.name ?? "Random";
  const isFavouriteSelection = isFavouriteLayoutSelection(
    layoutSelectorValue,
    settings.preferredLayouts,
    boardCount,
    excludedLayouts,
  );

  const setSelectedLayout = (layoutCanonicalName: string) => {
    setSettings({
      ...settings,
      selectedLayouts: {
        ...settings.selectedLayouts,
        [String(boardCount)]: layoutCanonicalName,
      },
    });
  };

  const setFavouriteLayout = (layoutCanonicalName: string | null) => {
    const nextSelectedLayouts = { ...settings.selectedLayouts };
    nextSelectedLayouts[String(boardCount)] = layoutCanonicalName ?? "";

    setSettings({
      ...setFavouriteLayoutForBoardCount(
        settings,
        boardCount,
        layoutCanonicalName,
      ),
      selectedLayouts: nextSelectedLayouts,
    });
  };

  const currentLayoutExcluded =
    Boolean(layoutSelectorValue) &&
    excludedLayouts.includes(layoutSelectorValue);
  const canToggleCurrentLayoutExclusion =
    Boolean(layoutSelectorValue) &&
    canExcludeLayout(currentLayoutExcluded, eligibleLayouts.length);

  const toggleCurrentLayoutExclusion = () => {
    if (!layoutSelectorValue) return;
    const updated = setLayoutExcludedForBoardCount(
      settings,
      boardCount,
      layoutSelectorValue,
      !currentLayoutExcluded,
    );
    setSettings(updated);
  };

  const checkboxRow = (
    label: string,
    checked: boolean,
    onChange: () => void,
    disabled = false,
    note?: string,
  ) => (
    <label className={`option-check ${disabled ? "disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span>{label}</span>
      {note && <em>{note}</em>}
    </label>
  );

  return (
    <section className="options-panel">
      <div className="panel-headline">
        <h2>Options</h2>
      </div>

      <div className="option-section slider-section">
        <h3>Spirit count</h3>
        <label className="spirits-slider">
          <div className="slider-label">
            <span>Number of spirits</span>
            <strong>{settings.numSpirits}</strong>
          </div>
          <Slider.Root
            className="slider-root"
            min={1}
            max={6}
            step={1}
            value={[settings.numSpirits]}
            onValueChange={([numSpirits]) => {
              const nextBoardCount =
                numSpirits + (settings.includeAdditionalBoard ? 1 : 0);
              setSettings(
                withFavouriteLayoutForBoardCount(
                  { ...settings, numSpirits },
                  nextBoardCount,
                ),
              );
            }}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb
              className="slider-thumb"
              aria-label="Number of spirits"
            />
          </Slider.Root>
        </label>
      </div>

      <div className="option-section board-layout-section">
        <h3>Board &amp; layout</h3>
        <div className="layout-controls">
          <label className="layout-select">
            <span>Layout</span>
            <select
              value={layoutSelectorValue}
              onChange={(event) => setSelectedLayout(event.target.value)}
              disabled={
                availableLayouts.length === 0 || settings.useThematicBoards
              }
              aria-label={`Layout for ${boardCount} boards`}
            >
              {boardCount !== 1 && <option value="">Random</option>}
              {availableLayouts.map((layout) => {
                const excluded = excludedLayouts.includes(
                  layout.canonicalName,
                );
                return (
                  <option
                    key={layout.canonicalName}
                    value={layout.canonicalName}
                  >
                    {layout.name}
                    {excluded ? " (excluded)" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label
            className={`option-check compact-option-check ${
              isFavouriteSelection ? "favourite-active" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={isFavouriteSelection}
              disabled={
                !canFavouriteLayout(
                  boardCount,
                  layoutSelectorValue,
                  availableLayouts.length,
                  settings.useThematicBoards,
                )
              }
              onChange={() => {
                if (isFavouriteSelection) {
                  setFavouriteLayout(null);
                  return;
                }

                const nextSelected = layoutSelectorValue || RANDOM_LAYOUT;
                setFavouriteLayout(nextSelected);
              }}
              aria-label={`Favourite ${selectedLayoutName} layout for ${boardCount} boards`}
            />
            <span>Favourite</span>
            {isFavouriteSelection && (
              <span className="favourite-badge">Saved</span>
            )}
          </label>

          <label
            className={`option-check compact-option-check ${
              currentLayoutExcluded ? "excluded-layout-active" : ""
            } ${
              !canToggleCurrentLayoutExclusion || settings.useThematicBoards
                ? "disabled"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={currentLayoutExcluded}
              disabled={
                !canToggleCurrentLayoutExclusion || settings.useThematicBoards
              }
              onChange={toggleCurrentLayoutExclusion}
              aria-label={`Exclude ${selectedLayoutName} layout for ${boardCount} boards`}
            />
            <span>Exclude</span>
          </label>

          {settings.useThematicBoards ? (
            <em>
              Thematic boards use a fixed island map; layouts are not used.
            </em>
          ) : currentLayoutExcluded ? (
            <em>
              This layout is excluded from generation for {boardCount} boards.
            </em>
          ) : layoutSelectorValue && !canToggleCurrentLayoutExclusion ? (
            <em>
              At least one layout must remain available for {boardCount} boards.
            </em>
          ) : !layoutSelectorValue ? (
            <em>Random selects from layouts that are not excluded.</em>
          ) : isFavouriteSelection ? (
            <em>
              ★ This layout is the saved favourite for {boardCount} boards.
            </em>
          ) : favouriteLayoutForBoardCount ? (
            <em>
              The current selection differs from the saved favourite for{" "}
              {boardCount} boards. Tick Favourite to save it.
            </em>
          ) : (
            <em>
              Choose a layout and tick Favourite to remember it for {boardCount}{" "}
              boards.
            </em>
          )}
        </div>

        <h4 className="option-subheading">Board rules</h4>
        <div className="option-grid">
          {checkboxRow(
            "Additional board",
            settings.includeAdditionalBoard,
            () => {
              const includeAdditionalBoard = !settings.includeAdditionalBoard;
              const nextBoardCount =
                settings.numSpirits + (includeAdditionalBoard ? 1 : 0);
              setSettings(
                withFavouriteLayoutForBoardCount(
                  { ...settings, includeAdditionalBoard },
                  nextBoardCount,
                ),
              );
            },
          )}
          {checkboxRow(
            "Strict board compatibility",
            settings.strictBoardCompatibility,
            () => toggle("strictBoardCompatibility"),
            strictDisabledByBoardCount,
            strictDisabledByBoardCount
              ? "requires four boards or fewer"
              : undefined,
          )}
          {checkboxRow("Thematic boards", settings.useThematicBoards, () =>
            toggle("useThematicBoards"),
          )}
        </div>
      </div>

      <div className="option-section">
        <h3>Randomizer shortcuts</h3>
        <p className="option-section-description">
          Quickly include or skip these randomizers without changing their pool
          selections.
        </p>
        <div className="option-grid">
          {checkboxRow("Randomize an adversary", settings.useAdversaries, () =>
            toggle("useAdversaries"),
          )}
          {checkboxRow("Randomize a scenario", settings.useScenarios, () =>
            toggle("useScenarios"),
          )}
        </div>
      </div>

      <div className="option-section">
        <h3>Digital Game Play Options</h3>
        <div className="option-grid">
          {checkboxRow("Branch & Claw", settings.expansionBranchClaw, () =>
            toggleExpansion("expansionBranchClaw"),
          )}
          {checkboxRow("Jagged Earth", settings.expansionJaggedEarth, () =>
            toggleExpansion("expansionJaggedEarth"),
          )}
          {checkboxRow(
            "Nature Incarnate",
            settings.expansionNatureIncarnate,
            () => toggleExpansion("expansionNatureIncarnate"),
            !settings.expansionJaggedEarth,
            !settings.expansionJaggedEarth
              ? "requires Jagged Earth"
              : undefined,
          )}
          {checkboxRow(
            "Use events",
            settings.useEvents,
            () => toggle("useEvents"),
            !anyExpansion,
            !anyExpansion ? "requires an expansion" : undefined,
          )}
        </div>
      </div>
    </section>
  );
}
