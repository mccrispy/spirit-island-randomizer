import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISSED_KEY = "sirpy-web.pwaInstallNoticeDismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "true";
  } catch (error) {
    console.warn("Could not read PWA notice dismissal:", error);
    return false;
  }
}

export function PwaInstallNotice({
  onLearnMore,
}: {
  onLearnMore: () => void;
}) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      if (
        typeof installEvent.prompt !== "function" ||
        !installEvent.userChoice
      ) {
        return;
      }
      event.preventDefault();
      setInstallPrompt(installEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!installPrompt || dismissed || installed) return null;

  const dismissNotice = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch (error) {
      console.warn("Could not save PWA notice dismissal:", error);
    }
  };

  const installApp = async () => {
    const prompt = installPrompt;
    setInstallPrompt(null);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
    } catch (error) {
      console.error("Could not show the app installation prompt:", error);
    }
  };

  return (
    <aside
      className="pwa-install-notice"
      aria-label="Install this app"
      aria-live="polite"
    >
      <p>
        Install the app for quick access and offline use.{" "}
        <a href="#pwa-installation" onClick={onLearnMore}>
          Learn more
        </a>
      </p>
      <div className="pwa-notice-actions">
        <button className="pwa-install-button" onClick={installApp}>
          Install
        </button>
        <button
          className="pwa-dismiss-button"
          onClick={dismissNotice}
          aria-label="Dismiss install notice"
          title="Dismiss"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
