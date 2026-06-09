import { defineConfig } from "vite";

/** GitHub Pages 部署时由 CI 注入，例如 /Screw-Puzzle/ */
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    open: true,
  },
});
