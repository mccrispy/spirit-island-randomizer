export function AboutTab() {
  return (
    <div className="about-copy">
      <div className="about-heading">
        <h2>About Spirit Island Randomizer v{__APP_VERSION__}</h2>
      </div>

      <section className="about-section disclaimer">
        <h3>Unofficial Fan-Made Tool</h3>
        <p>
          This application is an unofficial, fan-made tool created for personal,
          non-commercial use. It is not affiliated with, endorsed by, or
          connected to Eric Reuss, Lightning Heart Games LLC, Flat River Group,
          or Handelabra Games Inc.
        </p>
      </section>

      <section className="about-section">
        <h3>Spirit Island Intellectual Property</h3>
        <p>
          <strong>Spirit Island</strong> was designed by{" "}
          <strong>Eric Reuss</strong> (&ldquo;Spirit Island: A Game by Eric
          Reuss&rdquo;).
        </p>
        <p>
          <strong>Spirit Island</strong> is owned and licensed by{" "}
          <strong>Lightning Heart Games LLC</strong>.
        </p>
        <p>
          The <strong>Spirit Island board game</strong> is published by{" "}
          <strong>Flat River Group</strong>.
        </p>
        <p>
          The <strong>Spirit Island Digital</strong> adaptation is published by{" "}
          <strong>Handelabra Games Inc.</strong>
        </p>
        <p>
          All Spirit Island names, artwork, and game content are the property of
          their respective rights holders. No claim of ownership is made by this
          application.
        </p>
      </section>

      <section className="about-section">
        <h3>Third-Party Acknowledgements</h3>
        <ul>
          <li>
            <strong>React</strong> &mdash; UI library.
            <br />
            &copy; Meta Platforms, Inc. and contributors. Licensed under the{" "}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noreferrer"
            >
              MIT licence
            </a>
            .
          </li>
          <li>
            <strong>Radix UI</strong> &mdash; unstyled, accessible UI primitives
            (tabs, checkbox, select, slider, accordion).
            <br />
            Licensed under the{" "}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noreferrer"
            >
              MIT licence
            </a>
            .
          </li>
          <li>
            <strong>Tailwind CSS</strong> &mdash; utility-first styling
            framework.
            <br />
            Licensed under the{" "}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noreferrer"
            >
              MIT licence
            </a>
            .
          </li>
          <li>
            <strong>Vite</strong> &mdash; build tooling and dev server.
            <br />
            Licensed under the{" "}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noreferrer"
            >
              MIT licence
            </a>
            .
          </li>
          <li>
            <strong>Lucide</strong> &mdash; icon set.
            <br />
            Licensed under the{" "}
            <a
              href="https://opensource.org/licenses/ISC"
              target="_blank"
              rel="noreferrer"
            >
              ISC licence
            </a>
            .
          </li>
          <li>
            <strong>Spirit Island Wiki</strong> &mdash; board layout images are
            sourced from the Spirit Island Wiki and used under the terms of the{" "}
            <a
              href="https://spiritislandwiki.com/index.php?title=SpiritIsland:Copyrights"
              target="_blank"
              rel="noreferrer"
            >
              Creative Commons Attribution-NonCommercial-ShareAlike licence (CC
              BY-NC-SA)
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h3>Licence</h3>
        <p>
          This application is released under the{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
            International (CC BY-NC-ND 4.0)
          </a>{" "}
          licence.
        </p>
        <p>
          You may share this software freely with attribution. You may not use
          it for commercial purposes or distribute modified versions.
        </p>
      </section>
    </div>
  );
}
