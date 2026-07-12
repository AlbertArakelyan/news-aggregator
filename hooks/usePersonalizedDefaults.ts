import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

import { Preferences, resolvePersonalizedQuery } from "@/lib/preferences";
import { toQueryParams } from "@/lib/query";
import { ArticleQuery } from "@/lib/sources/types";

/**
 * Applies saved preferences to a bare feed by writing them **into the URL**.
 *
 * This is what keeps the personalized feed on the single existing data path: the
 * preferences become ordinary filters, `getServerSideProps` re-runs, and "my
 * feed" is still a shareable, server-rendered link. A separate personalized
 * *mode* would mean a second source of truth that can disagree with the address
 * bar.
 *
 * Preferences live in localStorage, so the server cannot know them: the first
 * paint is necessarily the general feed, and this corrects it on mount. That
 * costs one extra navigation on a bare visit and nothing thereafter.
 *
 * Whether to redirect at all is decided by `resolvePersonalizedQuery`, which is
 * pure and unit-tested. This hook only navigates.
 */
export default function usePersonalizedDefaults(
  preferences: Preferences,
  filters: ArticleQuery,
): void {
  const router = useRouter();

  // At most once per page lifetime. Without this, clearing the filters would
  // immediately re-apply the preferences and "Clear all" would look broken — the
  // reader could never get back to an unfiltered feed.
  const hasApplied = useRef(false);

  useEffect(() => {
    if (hasApplied.current) {
      return;
    }

    hasApplied.current = true;

    const personalized = resolvePersonalizedQuery(preferences, filters);

    if (!personalized) {
      return;
    }

    router.replace(
      { pathname: router.pathname, query: toQueryParams(personalized) },
      undefined,
      // `replace`, not `push`: the unpersonalized feed the reader never asked
      // for should not become a back-button destination.
      { scroll: false },
    );
  }, [filters, preferences, router]);
}
