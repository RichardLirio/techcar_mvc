import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/e2e-setup.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 60000,
    include: ["src/modules/order/*.e2e.spec.ts"],
    exclude: ["node_modules", "dist", ".git"],
    // Roda testes E2E sequencialmente para evitar conflitos no banco
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
