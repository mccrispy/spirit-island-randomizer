import * as Tabs from "@radix-ui/react-tabs";
import { useAppState } from "../../state/AppStateContext";
import { SpiritPoolTab } from "../tabs/SpiritPoolTab";
import { BoardsAdversariesScenariosTab } from "../tabs/BoardsAdversariesScenariosTab";
import { AboutTab } from "../tabs/AboutTab";
import { OptionsPanel } from "../OptionsPanel";
import { ResultsPanel } from "../ResultsPanel";

export function AppShell() {
  const { data, error, result, running, generate } = useAppState();

  if (error && !data)
    return (
      <main className="app-shell">
        <h1>SIRPY Web</h1>
        <p className="error">{error}</p>
      </main>
    );
  if (!data)
    return (
      <main className="app-shell">
        <h1>SIRPY Web</h1>
        <p>Loading game data...</p>
      </main>
    );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Spirit Island setup</p>
          <h1>SIRPY Web</h1>
        </div>
        <button
          className="primary-button"
          onClick={generate}
          disabled={running}
        >
          {" "}
          {running ? "Generating..." : "Generate setup"}{" "}
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <div className="app-layout">
        <Tabs.Root className="workspace" defaultValue="spirits">
          <Tabs.List className="tab-list" aria-label="Setup sections">
            <Tabs.Trigger className="tab-trigger" value="spirits">
              Spirits
            </Tabs.Trigger>
            <Tabs.Trigger className="tab-trigger" value="boards">
              Boards &amp; adversaries
            </Tabs.Trigger>
            <Tabs.Trigger className="tab-trigger" value="about">
              About
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="tab-content" value="spirits">
            <div className="content-heading">
              <h2>Spirit pool</h2>
            </div>
            <SpiritPoolTab />
          </Tabs.Content>
          <Tabs.Content className="tab-content" value="boards">
            <div className="content-heading">
              <h2>Boards, adversaries &amp; scenarios</h2>
            </div>
            <BoardsAdversariesScenariosTab />
          </Tabs.Content>
          <Tabs.Content className="tab-content" value="about">
            <div className="content-heading">
              <h2>About</h2>
            </div>
            <AboutTab />
          </Tabs.Content>
        </Tabs.Root>
        <div className="side-stack">
          <OptionsPanel />
          <ResultsPanel />
        </div>
      </div>
    </main>
  );
}
