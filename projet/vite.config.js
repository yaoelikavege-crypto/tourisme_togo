import { defineConfig } from "vite";

// base: "./" -> chemins relatifs, indispensable pour un déploiement
// statique (GitHub Pages, Netlify, Vercel) y compris dans un sous-dossier.
export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Autorise les hôtes de prévisualisation (proxy Arena, tunnels, etc.)
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    // les images et les JSON de data/ dépassent la limite par défaut
    assetsInlineLimit: 0,
  },
  publicDir: false,
});
