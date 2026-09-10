import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { UserGuideTab } from "./UserGuideTab";

describe("UserGuideTab", () => {
  it("renders all key guide sections and explanations", () => {
    const html = renderToString(<UserGuideTab />);

    expect(html).toContain("Quick Start");
    expect(html).toContain("Tri-State Selection System");
    expect(html).toContain("Filtering vs. Selecting Spirits");
    expect(html).toContain("Board Layouts &amp; Favourites");
    expect(html).toContain("Board Rules &amp; Digital Game Play Options");
    expect(html).toContain("Automatic Saving");
    expect(html).toContain("Report an Issue");

    // Key concepts explained in guide
    expect(html).toContain("Excluded");
    expect(html).toContain("In Pool");
    expect(html).toContain("Forced");
    expect(html).toContain("Left-click moves forward and right-click moves");
    expect(html).toContain("Space or Enter to move forward");
    expect(html).toContain("favourite layout for that board count");
    expect(html).toContain("Thematic boards");
    expect(html).toContain("Randomizer Shortcuts");
    expect(html).toContain(
      "individual adversary and scenario pool selections unchanged",
    );
    expect(html).toContain("project’s GitHub Issues page");
  });
});
