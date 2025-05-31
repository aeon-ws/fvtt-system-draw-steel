import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
    root: "src",
    plugins: [
        tsconfigPaths(),
        react(),
    ],
    build: {
        cssCodeSplit: false,
        sourcemap: true,
        outDir: "../dist",
        emptyOutDir: true,
        target: "es2020",
        rollupOptions: {
            input: "src/main.ts",
            output: {
                entryFileNames: "main.js",
                format: "es",
                assetFileNames: "styles.css",
            },
            external: [/^foundry\//]
        }
    }
});
