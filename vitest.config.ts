import { defineConfig } from "vitest/config";

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify("test"),
    },
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
            },
        },
        globals: true,
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        setupFiles: ["./src/test-setup.ts"],
    },
});
