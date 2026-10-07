import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { UserGuideTab } from "./UserGuideTab";

describe("UserGuideTab", () => {
  it("renders all key guide sections and explanations", () => {
    const html = renderToString(<UserGuideTab />);

    expect(html).toContain("Quick Start");
    expect(html).toContain("Clear result");
    expect(html).toContain("Tri-State Selection System");
    expect(html).toContain("Filtering vs. Selecting Spirits");
    expect(html).toContain("Board &amp; Layout");
    expect(html).toContain("Board Rules &amp; Digital Game Play Options");
    expect(html).toContain("Automatic Saving");
    expect(html).toContain('id="pwa-installation"');
    expect(html).toContain("Install &amp; Use Offline");
    expect(html).toContain("Add to Home Screen");
    expect(html).toContain("initial visit");
    expect(html).toContain("What still needs internet");
    expect(html).toContain("Saving &amp; Loading Profiles");
    expect(html).toContain("Report an Issue");

    // Key concepts explained in guide
    expect(html).toContain("Excluded");
    expect(html).toContain("In Pool");
    expect(html).toContain("Forced");
    expect(html).toContain("Only one");
    expect(html).toContain("moves the previous one to In Pool");
    expect(html).toContain("Left-click moves forward and right-click moves");
    expect(html).toContain("Space or Enter to move forward");
    expect(html).toContain("Favouriting a layout makes it the default");
    expect(html).toContain("matching the current filters");
    expect(html).toContain("Select matching");
    expect(html).toContain("an aspect-only summary");
    expect(html).toContain("Aspects: 2 in pool, 1 forced");
    expect(html).toContain("the base spirit is not included");
    expect(html).toContain("cannot be both favourite and excluded");
    expect(html).toContain("(excluded)");
    expect(html).toContain("there is no Random choice");
    expect(html).toContain("Thematic boards");
    expect(html).toContain("Randomizer Shortcuts");
    expect(html).toContain(
      "individual adversary and scenario pool selections unchanged",
    );
    expect(html).toContain("Save Profile");
    expect(html).toContain("Reset to Default");
    expect(html).toContain("project’s GitHub Issues page");
  });
});
