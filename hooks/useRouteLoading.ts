import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * True while a navigation is in flight.
 *
 * Filters live in the URL, so applying one is a route change that re-runs
 * getServerSideProps — a real round trip to three providers. Without this the
 * feed would sit there looking broken until the new props arrive.
 *
 * setState happens inside the router's event callbacks, never in the effect
 * body, so this does not trip react-hooks/set-state-in-effect.
 */
export default function useRouteLoading(): boolean {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const start = () => setIsLoading(true);
    const stop = () => setIsLoading(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    // Without the error handler a cancelled navigation leaves the feed
    // permanently in its loading state.
    router.events.on("routeChangeError", stop);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  return isLoading;
}
