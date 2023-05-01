import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from "@svgr/rollup"

export default defineConfig(() => ({
    plugins: [react(), svgr()],
    server: {
        port: 3000
    }
}))
