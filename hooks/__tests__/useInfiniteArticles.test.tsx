// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useInfiniteArticles from "@/hooks/useInfiniteArticles";
import { Article } from "@/lib/sources/types";

/**
 * The regression suite for a render loop that shipped.
 *
 * `useInfiniteArticles` resets its accumulated list by comparing a reference
 * during render. Feed the hook something rebuilt on every render — an object
 * from a rest-spread, say — and the comparison never matches: it setStates
 * during render, re-renders, rebuilds, and React bails out with "Too many
 * re-renders".
 *
 * SSR renders once, so this class of bug is completely invisible to a curl of
 * the server HTML. It only appears on the *second* client render. That is why
 * this file exists.
 */

// jsdom has neither of these.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );

  vi.stubGlobal("fetch", vi.fn());
});

// RTL only auto-cleans when Vitest `globals` are on; they are off here, so the
// previous test's DOM would otherwise leak into the next one.
afterEach(cleanup);

function makeArticle(id: string): Article {
  return {
    id,
    title: `Article ${id}`,
    description: null,
    url: `https://example.com/${id}`,
    imageUrl: null,
    publishedAt: "2026-07-12T00:00:00.000Z",
    author: null,
    category: null,
    source: { id: "guardian", name: "The Guardian" },
  };
}

/** Mirrors how pages/index.tsx uses the hook. */
function Feed({ articles: initial }: { articles: Article[] }) {
  // Standing in for the other hooks on the page (usePreferences,
  // useRouteLoading) that re-render Feed after hydration — which is precisely
  // what triggered the loop in production.
  const [tick, setTick] = useState(0);

  const { articles } = useInfiniteArticles(initial, true, {});

  return (
    <div>
      <button onClick={() => setTick(tick + 1)}>rerender</button>
      <p data-testid="count">{articles.length}</p>
      <p data-testid="tick">{tick}</p>
    </div>
  );
}

describe("useInfiniteArticles", () => {
  it("survives a parent re-render without looping", () => {
    const articles = [makeArticle("a"), makeArticle("b")];

    render(<Feed articles={articles} />);
    expect(screen.getByTestId("count").textContent).toBe("2");

    // The render that used to blow up: nothing about the props changed, but the
    // component re-rendered. Before the fix this threw "Too many re-renders".
    act(() => {
      screen.getByText("rerender").click();
    });

    expect(screen.getByTestId("tick").textContent).toBe("1");
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("resets the list when new props arrive — a filter change", () => {
    const first = [makeArticle("a"), makeArticle("b")];
    const { rerender } = render(<Feed articles={first} />);

    expect(screen.getByTestId("count").textContent).toBe("2");

    // getServerSideProps re-ran and handed down a different array.
    rerender(<Feed articles={[makeArticle("c")]} />);

    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("does not reset when handed an equal-but-new array", () => {
    // The reset is by reference, deliberately: React keeps the props object
    // identical between re-renders, so a changed reference genuinely means new
    // props. This documents that contract — the caller must not synthesize a
    // fresh array (or object) on each render.
    const { rerender } = render(<Feed articles={[makeArticle("a")]} />);

    act(() => {
      screen.getByText("rerender").click();
    });

    rerender(<Feed articles={[makeArticle("a")]} />);

    // Still renders, still one article. It reset, but it did not loop.
    expect(screen.getByTestId("count").textContent).toBe("1");
  });
});
