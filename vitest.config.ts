import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  // Mirror tsconfig's "@/*" -> "./src/*" so value imports through the alias resolve
  // in tests the same way they do under tsc / next build.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
