import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: false,
    // Setup dummy env untuk module yang import DATABASE_URL.
    // Test yang benar-benar query DB akan di-skip / error.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Mock `server-only` agar Vitest tidak error (package ini hanya untuk Next.js)
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
});
