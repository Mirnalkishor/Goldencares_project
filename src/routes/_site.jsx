import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import StickyActionBar from "@/components/site/StickyActionBar";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
        <SiteFooter />
        <StickyActionBar />
      </div>
    </MotionConfig>
  );
}
