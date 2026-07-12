import Head from "next/head";

import useTheme from "@/hooks/useTheme";
import { Theme } from "@/lib/theme";

const THEMES: Theme[] = ["light", "dark", "system"];

const SURFACES = [
  { token: "bg-background", label: "background" },
  { token: "bg-surface", label: "surface" },
  { token: "bg-surface-hover", label: "surface-hover" },
  { token: "bg-surface-sunken", label: "surface-sunken" },
];

const TEXTS = [
  { token: "text-text-color", label: "text-color" },
  { token: "text-muted-text", label: "muted-text" },
  { token: "text-subtle-text", label: "subtle-text" },
];

// Written out in full, never interpolated: Tailwind scans source as plain text, so
// a constructed class like `bg-${status}` is never generated.
const STATUSES = [
  { label: "danger", bg: "bg-danger-bg", solid: "bg-danger", fg: "text-danger-foreground", text: "text-danger" },
  { label: "success", bg: "bg-success-bg", solid: "bg-success", fg: "text-success-foreground", text: "text-success" },
  { label: "warning", bg: "bg-warning-bg", solid: "bg-warning", fg: "text-warning-foreground", text: "text-warning" },
  { label: "info", bg: "bg-info-bg", solid: "bg-info", fg: "text-info-foreground", text: "text-info" },
];

/**
 * Temporary design-system preview. This page exists to prove the token wiring and
 * the theme switch work end to end; it is replaced by the real feed in step 3 of
 * PLAN.md. Deliberately built from raw elements, not UI primitives — those do not
 * exist yet, and this is what they will be built against.
 */
export default function DesignSystemPreview() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <>
      <Head>
        <title>Design system — News Aggregator</title>
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Design system</h1>
            <p className="mt-2 text-muted-text">
              Semantic tokens, one class per role. Everything below follows the theme
              without a single <code className="font-mono text-sm">dark:</code> class.
            </p>
          </div>

          <div
            className="flex shrink-0 rounded-lg border border-border-color bg-surface p-1"
            role="group"
            aria-label="Theme"
          >
            {THEMES.map((option) => {
              const isActive = theme === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  aria-pressed={isActive}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize transition outline-none focus-visible:ring-3 focus-visible:ring-ring ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-text hover:bg-ghost-hover hover:text-text-color"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </header>

        <p className="mb-12 text-sm text-muted-text">
          Preference: <span className="font-mono">{theme}</span>
          {" · "}
          Rendering: <span className="font-mono">{resolvedTheme}</span>
        </p>

        <Section title="Surfaces">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SURFACES.map(({ token, label }) => (
              <div
                key={token}
                className={`${token} rounded-lg border border-border-color p-4`}
              >
                <span className="font-mono text-xs text-muted-text">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Text">
          <div className="space-y-2 rounded-lg border border-border-color bg-surface p-5">
            {TEXTS.map(({ token, label }) => (
              <p key={token} className={token}>
                The quick brown fox jumps over the lazy dog{" "}
                <span className="font-mono text-xs">({label})</span>
              </p>
            ))}
          </div>
        </Section>

        <Section title="Actions">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground transition outline-none hover:bg-primary-hover active:bg-primary-active focus-visible:ring-3 focus-visible:ring-ring">
              Primary
            </button>
            <button className="rounded-md bg-secondary px-4 py-1.5 text-secondary-foreground transition outline-none hover:bg-secondary-hover active:bg-secondary-active focus-visible:ring-3 focus-visible:ring-ring">
              Secondary
            </button>
            <button className="rounded-md px-4 py-1.5 text-text-color transition outline-none hover:bg-ghost-hover active:bg-ghost-active focus-visible:ring-3 focus-visible:ring-ring">
              Ghost
            </button>
            <button
              disabled
              className="cursor-not-allowed rounded-md bg-primary px-4 py-1.5 text-primary-foreground opacity-50"
            >
              Disabled
            </button>
          </div>
        </Section>

        <Section title="Status">
          <div className="grid gap-3 sm:grid-cols-2">
            {STATUSES.map(({ label, bg, solid, fg, text }) => (
              <div
                key={label}
                className={`${bg} rounded-lg border border-border-color p-4`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`${solid} ${fg} rounded px-2 py-0.5 text-xs font-medium capitalize`}
                  >
                    {label}
                  </span>
                  <span className={`${text} text-sm capitalize`}>{label} text</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Borders">
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg border border-border-color p-4">
              <span className="font-mono text-xs text-muted-text">border-color</span>
            </div>
            <div className="flex-1 rounded-lg border border-border-strong p-4">
              <span className="font-mono text-xs text-muted-text">border-strong</span>
            </div>
          </div>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-subtle-text">
        {title}
      </h2>
      {children}
    </section>
  );
}
