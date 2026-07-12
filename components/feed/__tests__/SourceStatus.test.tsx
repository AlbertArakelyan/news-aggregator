// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SourceStatus from "@/components/feed/SourceStatus";
import { SourceResult } from "@/lib/sources/types";

afterEach(cleanup);

const ok: SourceResult = {
  id: "guardian",
  name: "The Guardian",
  ok: true,
  count: 20,
};

describe("SourceStatus", () => {
  it("explains that no sources are configured, rather than saying nothing", () => {
    // The regression: `docker compose up` passed no API keys, so every adapter
    // reported itself unconfigured, nothing was queried, and the feed rendered
    // "No articles found" — which blamed the news instead of the config.
    render(<SourceStatus sources={[]} />);

    expect(screen.getByRole("status").textContent).toContain(
      "No news sources are configured",
    );
    expect(screen.getByText("GUARDIAN_API_KEY")).toBeDefined();
  });

  it("names a source that failed while the rest of the feed survives", () => {
    render(
      <SourceStatus
        sources={[
          ok,
          { id: "nyt", name: "New York Times", ok: false, count: 0, error: "429" },
        ]}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Some sources could not be reached",
    );
    expect(screen.getByText("New York Times")).toBeDefined();
  });

  it("stays out of the way when everything worked", () => {
    const { container } = render(<SourceStatus sources={[ok]} />);

    expect(container.firstChild).toBeNull();
  });
});
