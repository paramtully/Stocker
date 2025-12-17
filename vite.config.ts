import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from "vite"

export default defineConfig({
plugins: [react(), tailwindcss()],
root: "client",
resolve: {
    alias: {
    "@": path.resolve(__dirname, "./client/src"),
    "@shared": path.resolve(__dirname, "./shared"),
    },
},
})