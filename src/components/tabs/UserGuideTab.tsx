export function UserGuideTab() {
  return (
    <div className="guide-copy">
      <section className="guide-section">
        <h3>Quick Start</h3>
        <p>
          Spirit Island Randomizer generates balanced, customized Spirit Island
          setups based on your collection and preferences:
        </p>
        <ol className="guide-steps">
          <li>
            <strong>Set your pool:</strong> Use the <em>Spirits</em> and{" "}
            <em>Boards &amp; adversaries</em> tabs to include or exclude items.
          </li>
          <li>
            <strong>Configure game options:</strong> Adjust the spirit count,
            layout preferences, and board rules in the <em>Options</em> panel on
            the right.
          </li>
          <li>
            <strong>Generate setup:</strong> Click <strong>Generate</strong> in
            the <em>Results</em> panel to create your randomized game setup,
            complete with board layout diagrams and digital launch links.
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
          Excluded to In Pool to Forced to Excluded is the forward order;
          right-click uses that order in reverse.
        </p>
        <div className="guide-legend-grid">
          <div className="guide-legend-item">
            <span className="legend-icon excluded">&#8722;</span>
            <div>
              <strong>Excluded (Unchecked)</strong>
              <p>
                The item is removed from the pool and will never be selected by
                the randomizer.
              </p>
            </div>
          </div>
          <div className="guide-legend-item">
            <span className="legend-icon in-pool">&#10003;</span>
            <div>
              <strong>In Pool (Checked)</strong>
              <p>
                The item is included in the candidate pool and may be randomly
                picked.
              </p>
            </div>
          </div>
          <div className="guide-legend-item">
            <span className="legend-icon forced">&#9733;</span>
            <div>
              <strong>Forced (Star)</strong>
              <p>
                The item is guaranteed to appear in your generated setup,
                provided player count and game constraints allow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-section">
        <h3>Filtering vs. Selecting Spirits</h3>
        <p>
          The Spirit Pool tab provides powerful tools to manage large
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
            <strong>Quick Picks:</strong> <em>Base spirits</em> and{" "}
            <em>Aspects</em> set the matching type across the pool.{" "}
            <em>Select visible</em> and <em>Deselect visible</em> only affect
            items shown by the current filters. For instance, if you filter by
            &ldquo;Nature Incarnate&rdquo; and select visible, only Nature
            Incarnate spirits are added to the active pool.
          </li>
          <li>
            <strong>Aspects:</strong> Click on a spirit row to expand its
            aspects. You can include base spirits, specific aspects, or both in
            the pool.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <h3>Board Layouts &amp; Favourites</h3>
        <p>
          Board layout configuration adapts dynamically to your chosen setup:
        </p>
        <ul>
          <li>
            <strong>Board Count Dependency:</strong> Island layouts are specific
            to the total number of boards in play (Spirit Count + Additional
            Board). Changing the spirit count updates the list of valid layouts.
          </li>
          <li>
            <strong>Layout Favourites:</strong> When you select a specific
            layout in the Options panel, it is saved as your{" "}
            <strong>favourite layout for that board count</strong>. Whenever you
            switch back to that board count in future sessions, your favourite
            layout is remembered and chosen by default.
          </li>
          <li>
            <strong>Random Layouts:</strong> Select &ldquo;Random&rdquo; and
            tick Favourite to remember a random layout choice for that board
            count. The randomizer will then pick any valid layout whenever you
            use it.
          </li>
          <li>
            <strong>Thematic Boards:</strong> When &ldquo;Thematic boards&rdquo;
            is enabled, the game uses the fixed canonical island map designed
            for that player count. Layout selection is disabled because thematic
            boards do not use modular board layouts.
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
            number of spirits for an extra tactical challenge.
          </li>
          <li>
            <strong>Strict Board Compatibility:</strong> Ensures island boards
            are arranged so that matching edge letters/numbers connect
            harmoniously. Per official rules, this is supported for games with 4
            boards or fewer.
          </li>
          <li>
            <strong>Digital Game Play Options:</strong> The expansion checkboxes
            and <em>Use events</em> control match the content and Event cards
            available in Spirit Island Digital. Events require at least one of
            Branch &amp; Claw, Jagged Earth, or Nature Incarnate.
          </li>
          <li>
            <strong>Randomizer Shortcuts:</strong>{" "}
            <em>Randomize an adversary</em>
            and <em>Randomize a scenario</em> quickly include or skip those
            randomizers for the next setup. They leave your individual adversary
            and scenario pool selections unchanged.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <h3>Automatic Saving</h3>
        <p>
          All your pool selections, favourite layouts, and rule settings are
          automatically saved in your browser&rsquo;s local storage. Your
          choices will be preserved when you refresh or revisit the app.
        </p>
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
