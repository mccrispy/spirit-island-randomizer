import * as Slider from "@radix-ui/react-slider";
import { useEffect, useRef } from "react";
import { useAppState } from "../state/AppStateContext";
import type { SettingsState } from "../persistence";

export function OptionsPanel() {
  const { settings, setSettings } = useAppState();
  const savedStrictCompatibilityRef = useRef<boolean | null>(null);
  const totalBoards = settings
    ? settings.numSpirits + (settings.includeAdditionalBoard ? 1 : 0)
    : 0;
  // PRM parity: strict compatibility is force-unchecked and disabled once total boards > 4,
  // and its prior value is restored once the count drops back to 4 or fewer.
  const strictDisabledByBoardCount = totalBoards >= 5;

  useEffect(() => {
    if (!settings) return;
    if (strictDisabledByBoardCount && settings.strictBoardCompatibility) {
      savedStrictCompatibilityRef.current = true;
      setSettings({ ...settings, strictBoardCompatibility: false });
    } else if (!strictDisabledByBoardCount && savedStrictCompatibilityRef.current !== null) {
      const saved = savedStrictCompatibilityRef.current;
      savedStrictCompatibilityRef.current = null;
      setSettings({ ...settings, strictBoardCompatibility: saved });
    }
    // Only re-run when the board count crosses the threshold, not on every settings change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalBoards, strictDisabledByBoardCount]);

  if (!settings) return null;
  const toggle = (key: keyof SettingsState) =>
    setSettings({ ...settings, [key]: !settings[key] });

  // PRM parity: NI requires JE; Use Events requires any of the 3 expansion checkboxes,
  // and is force-unchecked (not just disabled) when the requirement stops being met.
  const toggleExpansion = (
    key: "expansionBranchClaw" | "expansionJaggedEarth" | "expansionNatureIncarnate",
  ) => {
    const updated: SettingsState = { ...settings, [key]: !settings[key] };
    if (key === "expansionJaggedEarth" && !updated.expansionJaggedEarth) {
      updated.expansionNatureIncarnate = false;
    }
    const anyExpansion =
      updated.expansionBranchClaw || updated.expansionJaggedEarth || updated.expansionNatureIncarnate;
    if (!anyExpansion) updated.useEvents = false;
    setSettings(updated);
  };

  const anyExpansion =
    settings.expansionBranchClaw || settings.expansionJaggedEarth || settings.expansionNatureIncarnate;

  return (
    <section className="options-panel">
      <h2>Options</h2>
      <div className="option-grid">
        <label>
          <input
            type="checkbox"
            checked={settings.expansionBranchClaw}
            onChange={() => toggleExpansion("expansionBranchClaw")}
          />{" "}
          Branch &amp; Claw
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.expansionJaggedEarth}
            onChange={() => toggleExpansion("expansionJaggedEarth")}
          />{" "}
          Jagged Earth
        </label>
        <label className={!settings.expansionJaggedEarth ? "disabled-option" : undefined}>
          <input
            type="checkbox"
            checked={settings.expansionNatureIncarnate}
            disabled={!settings.expansionJaggedEarth}
            onChange={() => toggleExpansion("expansionNatureIncarnate")}
          />{" "}
          Nature Incarnate
          {!settings.expansionJaggedEarth && <em> requires Jagged Earth</em>}
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.includeAdditionalBoard}
            onChange={() => toggle("includeAdditionalBoard")}
          />{" "}
          Additional board
        </label>
        <label className={strictDisabledByBoardCount ? "disabled-option" : undefined}>
          <input
            type="checkbox"
            checked={settings.strictBoardCompatibility}
            disabled={strictDisabledByBoardCount}
            onChange={() => toggle("strictBoardCompatibility")}
          />{" "}
          Strict board compatibility
          {strictDisabledByBoardCount && <em> requires four boards or fewer</em>}
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.useThematicBoards}
            onChange={() => toggle("useThematicBoards")}
          />{" "}
          Thematic boards
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.useAdversaries}
            onChange={() => toggle("useAdversaries")}
          />{" "}
          Use adversary
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.useScenarios}
            onChange={() => toggle("useScenarios")}
          />{" "}
          Use scenario
        </label>
        <label className={!anyExpansion ? "disabled-option" : undefined}>
          <input
            type="checkbox"
            checked={settings.useEvents}
            disabled={!anyExpansion}
            onChange={() => toggle("useEvents")}
          />{" "}
          Use events
          {!anyExpansion && <em> requires an expansion</em>}
        </label>
      </div>
      <label className="spirits-slider">
        Number of spirits: <strong>{settings.numSpirits}</strong>
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
          <Slider.Thumb className="slider-thumb" aria-label="Number of spirits" />
        </Slider.Root>
      </label>
    </section>
  );
}
