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
): string {
  const selectedLayout =
    selectedLayouts[String(boardCount)] ??
    getBoardCountFavouriteLayout(preferredLayouts, boardCount);
  return selectedLayout === RANDOM_LAYOUT ? "" : selectedLayout;
}

export function isFavouriteLayoutSelection(
  selectedLayout: string,
  preferredLayouts: Record<string, string>,
  boardCount: number,
): boolean {
  return (
    (selectedLayout || RANDOM_LAYOUT) ===
    getBoardCountFavouriteLayout(preferredLayouts, boardCount)
  );
}

export function withFavouriteLayoutForBoardCount(
  settings: SettingsState,
  boardCount: number,
): SettingsState {
  return {
    ...settings,
    selectedLayouts: {
      ...settings.selectedLayouts,
      [String(boardCount)]: getBoardCountFavouriteLayout(
        settings.preferredLayouts,
        boardCount,
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
  const favouriteLayoutForBoardCount = getBoardCountFavouriteLayout(
    settings.preferredLayouts,
    boardCount,
  );
  const selectedLayoutForBoardCount = getBoardCountSelectedLayout(
    settings.selectedLayouts,
    settings.preferredLayouts,
    boardCount,
  );
  const isFavouriteSelection = isFavouriteLayoutSelection(
    selectedLayoutForBoardCount,
    settings.preferredLayouts,
    boardCount,
  );
  const availableLayouts = data.layouts.filter((layout) =>
    layout.validBoardCounts.includes(boardCount),
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
    const nextFavouriteLayouts = { ...settings.preferredLayouts };
    const nextSelectedLayouts = { ...settings.selectedLayouts };

    if (layoutCanonicalName === null) {
      delete nextFavouriteLayouts[String(boardCount)];
    } else {
      nextFavouriteLayouts[String(boardCount)] = layoutCanonicalName;
    }

    nextSelectedLayouts[String(boardCount)] = layoutCanonicalName ?? "";

    setSettings({
      ...settings,
      preferredLayouts: nextFavouriteLayouts,
      selectedLayouts: nextSelectedLayouts,
    });
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

      <div className="option-section">
        <h3>Layout favourite</h3>
        <div className="layout-controls">
          <label className="layout-select">
            <span>Favourite layout</span>
            <select
              value={selectedLayoutForBoardCount}
              onChange={(event) => setSelectedLayout(event.target.value)}
              disabled={
                availableLayouts.length === 0 || settings.useThematicBoards
              }
              aria-label={`Favourite layout for ${boardCount} boards`}
            >
              <option value="">Random</option>
              {availableLayouts.map((layout) => (
                <option key={layout.canonicalName} value={layout.canonicalName}>
                  {layout.name}
                </option>
              ))}
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
                availableLayouts.length === 0 || settings.useThematicBoards
              }
              onChange={() => {
                if (isFavouriteSelection) {
                  setFavouriteLayout(null);
                  return;
                }

                const nextSelected =
                  selectedLayoutForBoardCount || RANDOM_LAYOUT;
                setFavouriteLayout(nextSelected);
              }}
              aria-label={`Save favourite layout for ${boardCount} boards`}
            />
            <span>Favourite</span>
            {isFavouriteSelection && (
              <span className="favourite-badge">Saved</span>
            )}
          </label>

          {settings.useThematicBoards ? (
            <em>
              Thematic boards use a fixed island map; layouts are not used.
            </em>
          ) : availableLayouts.length === 0 ? (
            <em>No valid layouts are available for {boardCount} boards.</em>
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
      </div>

      <div className="option-section">
        <h3>Board rules</h3>
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
