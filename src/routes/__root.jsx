import { useEffect } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { claritySnippet, trackPageView } from "@/lib/analytics";
import appCss from "@/index.css?url";

const FAVICON = "/images/goldencares-emblem.png";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#443322" },
      { title: "GoldenCares | Senior Companion Care in Chandigarh, Mohali & Panchkula" },
      {
        name: "description",
        content:
          "GoldenCares brings verified, warm-hearted companions to seniors in Chandigarh, Mohali and Panchkula. Temple visits, walks, doctor visits and everyday help — care that can start within hours.",
      },
      { property: "og:site_name", content: "GoldenCares" },
      { property: "og:title", content: "GoldenCares — companionship for seniors in the Tricity" },
      {
        property: "og:description",
        content:
          "Someone kind at your parent's door, often within hours. Background-checked companions across Chandigarh, Mohali and Panchkula.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: FAVICON },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Hanken+Grotesk:wght@300..700&display=swap",
      },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  // SPA navigations don't reload the document, so GA4 needs a page_view per route change.
  const href = useRouterState({ select: (state) => state.location.href });
  useEffect(() => {
    trackPageView(href);
  }, [href]);

  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}

// The document. There is no index.html: the server renders <html> from here.
function RootDocument({ children }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: claritySnippet() }} />
      </head>
      <body data-react-root="true">
        {children}
        <Scripts />
      </body>
    </html>
  );
}