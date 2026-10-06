import { TriState } from "../../engine/types";
import { TriStateIcon } from "../TriStateCheckbox";

export function UserGuideTab() {
  return (
    <div className="guide-copy">
      <section className="guide-section">
        <h3>Quick Start</h3>
        <p>
          Spirit Island Randomizer generates, customized Spirit Island setups
          based on your collection and preferences:
        </p>
        <ol className="guide-steps">
          <li>
            <strong>Set your pool:</strong> Use the <em>Spirits</em> and{" "}
            <em>Boards &amp; adversaries</em> tabs to include or exclude items.
          </li>
          <li>
            <strong>Configure game options:</strong> Adjust the spirit count,
            layout preferences, and board rules in <em>Options</em>. On mobile,
            Results and Options appear before the selection tabs.
          </li>
          <li>
            <strong>Generate setup:</strong> Click <strong>Generate</strong> in
            the <em>Results</em> panel to create your randomized game setup,
            complete with board layout diagrams and digital launch links.
          </li>
          <li>
            <strong>Clear result:</strong> After generating, use{" "}
            <em>Clear result</em> to return to the live layout preview. This
            keeps your options and pool selections so you can explore another
            board count before generating again.
          </li>
        </ol>
      </section>

      <section className="guide-section">
        <h3>Tri-State Selection System</h3>
        <p>
          Every spirit, aspect, board, adversary, and scenario uses a
          three-state selector. Left-click moves forward and right-click moves
          backward, so either other state is always one action away. Keyboard
          users can use Space or Enter to move forward:
        </p>
        <p>
          &ldquo;Excluded&rdquo; to &ldquo;In Pool&rdquo; to
          &ldquo;Forced&rdquo; to &ldquo;Excluded&rdquo; is the forward order;
          right-click uses that order in reverse.
        </p>
        <div className="guide-legend-grid">
          <div className="guide-legend-item">
            <span className="tri-state legend-swatch unchecked">
              <TriStateIcon value={TriState.UNCHECKED} />
            </span>
            <div>
              <strong>Excluded (Unchecked)</strong>
              <p>
                The item is removed from the pool and will never be selected by
                the randomizer.
              </p>
            </div>
          </div>
          <div className="guide-legend-item">
            <span className="tri-state legend-swatch checked">
              <TriStateIcon value={TriState.CHECKED} />
            </span>
            <div>
              <strong>In Pool (Checked)</strong>
              <p>
                The item is included in the candidate pool and may be randomly
                picked.
              </p>
            </div>
          </div>
          <div className="guide-legend-item">
            <span className="tri-state legend-swatch indeterminate">
              <TriStateIcon value={TriState.INDETERMINATE} />
            </span>
            <div>
              <strong>Forced (Star)</strong>
              <p>
                The item is guaranteed to appear in your generated setup,
                provided player count and game constraints allow. Only one
                base spirit or aspect in a spirit family can be forced at a
                time; forcing another moves the previous one to In Pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-section">
        <h3>Filtering vs. Selecting Spirits</h3>
        <p>
          The Spirit Pool tab provides several tools to manage large
          collections:
        </p>
        <ul>
          <li>
            <strong>Filter Pills &amp; Search:</strong> Clicking expansion
            pills, complexity pills, or typing in the search box alters which
            spirits are <em>visible</em> on screen. Filtering does <em>not</em>{" "}
            change whether a spirit is checked or unchecked for randomization.
          </li>
          <li>
            <strong>Quick Picks:</strong> All four actions affect only spirits
            and aspects matching the current filters; items outside the
            filtered set remain unchanged. <em>Base spirits only</em> and{" "}
            <em>Aspects only</em> select matching items of that type and
            deselect matching items of the other type. <em>Select matching</em>{" "}
            and <em>Deselect matching</em> include or exclude every matching
            item. A base spirit shown only to contain a matching aspect is not
            changed unless the base spirit itself matches the filters.
          </li>
          <li>
            <strong>Aspects:</strong> Click on a spirit row to expand its
            aspects. You can include base spirits, specific aspects, or both in
            the pool. A collapsed spirit row shows how many aspects are in
            the pool (including forced aspects) and how many of those are
            forced. The base spirit is not included in these counts.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <h3>Board &amp; Layout</h3>
        <p>
          Layout and board rules are grouped together in Options. Layout
          choices and exclusions are kept separately for each total board
          count (Spirit Count + any Additional Board):
        </p>
        <ul>
          <li>
            <strong>Choose a layout:</strong> Use the Layout menu to inspect or
            select a layout. Excluded layouts remain in the menu marked
            &ldquo;(excluded)&rdquo;, so you can restore them. One-board games
            use the only available layout, Standard, so there is no Random
            choice.
          </li>
          <li>
            <strong>Favourite and Exclude:</strong> The two checkboxes apply to
            the layout currently shown in the menu and are saved independently
            for each board count. Favouriting a layout makes it the default;
            excluding it removes it from random generation. A layout cannot be
            both favourite and excluded: checking either option clears the
            other. Random can be favourited, but cannot be excluded.
          </li>
          <li>
            <strong>Last available layout:</strong> The currently selected
            layout cannot be excluded if it is the only remaining choice.
          </li>
          <li>
            <strong>Thematic Boards:</strong> When &ldquo;Thematic boards&rdquo;
            is enabled, the game uses the fixed canonical island map designed
            for that player count. Layout selection and exclusions are disabled
            because thematic boards do not use modular board layouts; saved
            exclusions apply again when thematic mode is turned off.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <h3>Board Rules &amp; Digital Game Play Options</h3>
        <ul>
          <li>
            <strong>Sort Adversaries:</strong> Use the sort toggle on the Boards
            tab to sort adversaries alphabetically or by difficulty rating.
          </li>
          <li>
            <strong>Additional Board:</strong> Adds +1 island board beyond the
            number of spirits for an extra challenge.
          </li>
          <li>
            <strong>Strict Board Compatibility:</strong> Certain pairings of
            boards (A+H, B+E, C+G, and D+F) may create games with very swingy
            difficulties. The official rules support excluding these pairings in
            games with four or fewer boards. Enabling &ldquo;Strict Board
            Compatibility&rdquo; prevents these board pairings from being
            included in your setup. If you consider island variety more
            important than the increased chance of swingy difficulty, you can
            disable Strict Board Compatibility.
          </li>
          <li>
            <strong>Digital Game Play Options:</strong> The expansion checkboxes
            control whether Power, Fear, Event, and Blight cards from the{" "}
            expansions are used - Spirits are always available.{" "}
            <em>Use events</em> controls whether you use Events or Command
            Beasts when using expansions. Events require Branch &amp; Claw
            and/or Jagged Earth; Nature Incarnate requires Jagged Earth. The app
            will enforce these interrelated dependencies.
          </li>
          <li>
            <strong>Randomizer Shortcuts:</strong>{" "}
            <em>Randomize an adversary</em> and <em>Randomize a scenario</em>{" "}
            quickly include or skip those randomizers for the next setup. They
            leave your individual adversary and scenario pool selections
            unchanged.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <h3>Automatic Saving</h3>
        <p>
          All your pool selections, layout favourites and exclusions, and rule
          settings are automatically saved in your browser&rsquo;s local storage.
          Your choices will be preserved when you refresh or revisit the app.
        </p>
      </section>

      <section className="guide-section">
        <h3>Saving &amp; Loading Profiles</h3>
        <p>
          The <em>Profiles</em> tab lets you keep more than one saved setup, all
          stored in your browser&rsquo;s local storage&mdash;no files are ever
          saved to or uploaded from your device:
        </p>
        <ul>
          <li>
            <strong>Save Profile:</strong> Give your current selections and
            settings a name to save them as a profile. Saving over an existing
            name asks for confirmation before overwriting it.
          </li>
          <li>
            <strong>Load:</strong> Loading a profile replaces your current
            active selections and settings with the saved profile&rsquo;s.
          </li>
          <li>
            <strong>Delete:</strong> Removes a saved profile after confirmation.
          </li>
          <li>
            <strong>Reset to Default:</strong> Restores your current selections
            and settings to the app&rsquo;s first-run defaults, after
            confirmation. This does not affect any saved profiles.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <h3>Report an Issue</h3>
        <p>
          Use the <em>Report an issue</em> link in the page header to open this
          project&rsquo;s GitHub Issues page and report a problem or suggestion.
        </p>
      </section>
    </div>
  );
}
