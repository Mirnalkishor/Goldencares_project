// TanStack Start server entry (auto-detected by the Start Vite plugin). Nitro wraps this fetch handler in a
// real Node HTTP server for Firebase App Hosting. It also reports a page's loader and beforeLoad errors.
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { recordRouteError } from "@/lib/error-capture.server";

// Runs once the router has loaded the page.
const handler = createStartHandler((ctx) => {
  for (const match of ctx.router.state.matches) {
    if (match.status === "error") recordRouteError(ctx.request, match.error, match.routeId);
  }
  return defaultStreamHandler(ctx);
});

export default { fetch: handler };

