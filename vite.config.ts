import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
plugins: [react()],
root: "client",
build: {
  outDir: "../packages/server/src/infra/frontend/public",
  emptyOutDir: true,
},
resolve: {
    alias: {
    "@": path.resolve(__dirname, "./client/src"),
    "@shared": path.resolve(__dirname, "./shared"),
    },
},
})