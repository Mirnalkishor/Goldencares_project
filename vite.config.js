import { readFileSync } from "node:fs";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Every runtime dependency is bundled at startup, for the browser and the SSR server: one first imported
// mid-session makes Vite re-bundle, and a page rendered meanwhile on the server loads a second React.
// Not listed: React itself, the TanStack Start/Router framework (its plugin bundles it) and build-time plugins.
const NOT_PREBUNDLED = new Set(["react", "react-dom", "@tanstack/react-start", "@tanstack/react-router", "@tanstack/react-router-ssr-query", "tailwindcss-animate", "firebase", "firebase-admin"]);
const { dependencies } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
// The SDK's realtime transports: not direct dependencies, but app code importing one would otherwise be a new one.
const SDK_TRANSPORTS = ["partysocket", "socket.io-client"];
const PREBUNDLE = [...Object.keys(dependencies).filter((name) => !NOT_PREBUNDLED.has(name)), ...SDK_TRANSPORTS];
// In dev the browser otherwise fetches the router as ~100 separate files after the load event, delaying hydration
// by seconds behind the preview proxy. Browser only, and every browser entry point of the router, so one copy loads
// (templates/tests/tanstack-dev-router checks it).
const BROWSER_PREBUNDLE = [
  "@tanstack/react-router", "@tanstack/react-router/ssr/client", "@tanstack/router-core", "@tanstack/router-core/isServer",
  "@tanstack/router-core/ssr/client",
  "@tanstack/router-core/scroll-restoration-script", "@tanstack/history", "@tanstack/start-fn-stubs",
  "seroval", "seroval-plugins/web", "cookie-es",
];
// App Hosting injects FIREBASE_WEBAPP_CONFIG into the build environment. Use its public apiKey so a
// GitHub build needs no .env file and no secret; local .env values still win when present.
let appHostingApiKey;
try {
  appHostingApiKey = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG ?? "{}").apiKey;
} catch {
  appHostingApiKey = undefined;
}

export default defineConfig({
  define: appHostingApiKey ? { "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(appHostingApiKey) } : {},
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  optimizeDeps: { include: [...PREBUNDLE, ...BROWSER_PREBUNDLE] },
  plugins: [
    tanstackStart({ srcDirectory: "src" }),
    // Real Node HTTP server for Firebase App Hosting (and any other Node host).
    // Stable Nitro 2 compatibility plugin; TanStack Start >=1.132 no longer bundles Nitro by default.
    nitroV2Plugin({ preset: "firebase_app_hosting" }),
    react(),
  ],
});
