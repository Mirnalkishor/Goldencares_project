import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import appCss from "@/index.css?url";

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%230e4442'/%3E%3Cpath d='M12.5 29.5V19.5a7.5 7.5 0 0 1 15 0v10' fill='none' stroke='%23f8f3e9' stroke-width='2.4' stroke-linecap='round'/%3E%3Ccircle cx='20' cy='20.5' r='3.1' fill='%23e39a45'/%3E%3C/svg%3E";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0e4442" },
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
      </head>
      <body data-react-root="true">
        {children}
        <Scripts />
      </body>
    </html>
  );
}