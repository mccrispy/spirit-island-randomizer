import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PwaInstallNotice } from "./PwaInstallNotice";

describe("PwaInstallNotice", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("appears only when the browser offers installation and prompts on click", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onLearnMore = vi.fn();

    await act(async () => {
      root.render(<PwaInstallNotice onLearnMore={onLearnMore} />);
    });
    expect(container.textContent).toBe("");

    const installEvent = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({
          outcome: "accepted" as const,
          platform: "web",
        }),
      },
    );

    await act(async () => {
      window.dispatchEvent(installEvent);
    });
    expect(installEvent.defaultPrevented).toBe(true);
    expect(container.textContent).toContain("Install the app");
    await act(async () => {
      container.querySelector("a")?.click();
    });
    expect(onLearnMore).toHaveBeenCalledOnce();

    await act(async () => {
      container.querySelector("button")?.click();
      await Promise.resolve();
    });
    expect(installEvent.prompt).toHaveBeenCalledOnce();
    expect(container.textContent).toBe("");

    await act(async () => root.unmount());
    container.remove();
  });

  it("remembers an explicit dismissal", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<PwaInstallNotice onLearnMore={() => {}} />);
    });
    window.dispatchEvent(
      Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: vi.fn(),
        userChoice: Promise.resolve({
          outcome: "dismissed" as const,
          platform: "web",
        }),
      }),
    );
    await act(async () => Promise.resolve());

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>(
          'button[aria-label="Dismiss install notice"]',
        )
        ?.click();
    });
    expect(container.textContent).toBe("");
    expect(localStorage.getItem("sirpy-web.pwaInstallNoticeDismissed")).toBe(
      "true",
    );

    await act(async () => root.unmount());
    const secondRoot = createRoot(container);
    await act(async () => {
      secondRoot.render(<PwaInstallNotice onLearnMore={() => {}} />);
    });
    await act(async () => {
      window.dispatchEvent(
        Object.assign(
          new Event("beforeinstallprompt", { cancelable: true }),
          {
            prompt: vi.fn(),
            userChoice: Promise.resolve({
              outcome: "dismissed" as const,
              platform: "web",
            }),
          },
        ),
      );
    });
    expect(container.textContent).toBe("");
    await act(async () => secondRoot.unmount());
    container.remove();
  });
});
