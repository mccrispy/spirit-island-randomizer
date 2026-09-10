// vitest 1.6's built-in jsdom environment doesn't copy `localStorage` onto the global object
// (it's a Window.prototype accessor, not an own property, and isn't in vitest's copy list),
// so tests that exercise persistence.ts need it polyfilled here.
import { JSDOM } from "jsdom";

if (typeof globalThis.localStorage === "undefined") {
    const { window } = new JSDOM("", { url: "http://localhost/" });
    globalThis.localStorage = window.localStorage;
}
