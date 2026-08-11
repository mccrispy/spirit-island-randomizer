import { useEffect, useState } from "react";
import { loadAllData } from "./data/loader";
import type { AppData } from "./data/types";

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadAllData();
        setData(loaded);
      } catch (err) {
        setError(`Failed to load game data: ${err}`);
      }
    }
    load();
  }, []);

  if (error) {
    return <div className="app-shell"><h1>SIRPY Web</h1><p className="error">{error}</p></div>;
  }

  if (!data) {
    return <div className="app-shell"><h1>SIRPY Web</h1><p>Loading data...</p></div>;
  }

  return (
    <div className="app-shell">
      <header>
        <h1>SIRPY Web</h1>
        <p>Spirit Island randomizer port for GitHub Pages.</p>
      </header>
      <main>
        <section className="hero">
          <p>
            Data loaded: {data.spirits.length} base spirits, {data.aspects.length} aspects,
            {" "}{data.boards.length} boards, {data.adversaries.length} adversaries,
            {" "}{data.scenarios.length} scenarios.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
