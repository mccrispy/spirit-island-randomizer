import * as Slider from "@radix-ui/react-slider";
import { useEffect, useRef } from "react";
import { useAppState } from "../state/AppStateContext";
import type { SettingsState } from "../persistence";

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
  const preferredLayoutForBoardCount =
    settings.preferredLayouts[String(boardCount)] ?? "";
  const availableLayouts = data.layouts.filter((layout) =>
    layout.validBoardCounts.includes(boardCount),
  );

  const setPreferredLayout = (layoutCanonicalName: string) => {
    const next = { ...settings.preferredLayouts };
    if (!layoutCanonicalName) {
      delete next[String(boardCount)];
    } else {
      next[String(boardCount)] = layoutCanonicalName;
    }
    setSettings({ ...settings, preferredLayouts: next });
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
            onValueChange={([numSpirits]) =>
              setSettings({ ...settings, numSpirits })
            }
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
        <h3>Layout preference</h3>
        <div className="layout-controls">
          <label className="layout-select">
            <span>Preferred layout</span>
            <select
              value={preferredLayoutForBoardCount}
              onChange={(event) => setPreferredLayout(event.target.value)}
              disabled={
                availableLayouts.length === 0 || settings.useThematicBoards
              }
            >
              <option value="">Random</option>
              {availableLayouts.map((layout) => (
                <option key={layout.canonicalName} value={layout.canonicalName}>
                  {layout.name}
                </option>
              ))}
            </select>
          </label>

          <label className="option-check compact-option-check">
            <input
              type="checkbox"
              checked={Boolean(preferredLayoutForBoardCount)}
              disabled={
                availableLayouts.length === 0 || settings.useThematicBoards
              }
              onChange={() => {
                if (preferredLayoutForBoardCount) {
                  setPreferredLayout("");
                } else {
                  setPreferredLayout(availableLayouts[0]?.canonicalName ?? "");
                }
              }}
            />
            <span>Preferred</span>
          </label>
          {settings.useThematicBoards && (
            <em>disabled — thematic boards use no layout</em>
          )}
        </div>
      </div>

      <div className="option-section">
        <h3>Expansions</h3>
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
        </div>
      </div>

      <div className="option-section">
        <h3>Board rules</h3>
        <div className="option-grid">
          {checkboxRow(
            "Additional board",
            settings.includeAdditionalBoard,
            () => toggle("includeAdditionalBoard"),
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
        <h3>Game toggles</h3>
        <div className="option-grid">
          {checkboxRow("Use adversary", settings.useAdversaries, () =>
            toggle("useAdversaries"),
          )}
          {checkboxRow("Use scenario", settings.useScenarios, () =>
            toggle("useScenarios"),
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
