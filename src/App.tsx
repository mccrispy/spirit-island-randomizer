import { AppStateProvider } from "./state/AppStateContext";
import { AppShell } from "./components/layout/AppShell";

function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}

export default App;
