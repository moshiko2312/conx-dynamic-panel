import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      name: "ConXDynamicPanelCard",
      formats: ["es"],
      fileName: () => "conx-dynamic-panel-card.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
