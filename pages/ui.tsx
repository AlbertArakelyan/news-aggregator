import { Bookmark, Newspaper, Search, TriangleAlert } from "lucide-react";
import Head from "next/head";
import { useState } from "react";

import ThemeToggle from "@/components/theme/ThemeToggle";
import Button from "@/components/UI/Button/Button";
import Card from "@/components/UI/Card/Card";
import Checkbox from "@/components/UI/Checkbox/Checkbox";
import Chip from "@/components/UI/Chip/Chip";
import Drawer from "@/components/UI/Drawer/Drawer";
import EmptyState from "@/components/UI/EmptyState/EmptyState";
import Input from "@/components/UI/Input/Input";
import Select from "@/components/UI/Select/Select";
import Skeleton from "@/components/UI/Skeleton/Skeleton";
import Spinner from "@/components/UI/Spinner/Spinner";

const SOURCES = [
  { value: "guardian", label: "The Guardian" },
  { value: "nyt", label: "New York Times" },
  { value: "newsapi", label: "NewsAPI" },
];

/**
 * Component gallery at /ui — a lightweight stand-in for Storybook.
 *
 * Every primitive in components/UI appears here, in every variant. When a
 * component is added or its props change, update this page in the same commit:
 * it is the only place the whole library is rendered at once, and it is how a
 * regression in one variant gets noticed.
 *
 * Temporary. Delete this page (and this route) before final delivery — it is
 * developer scaffolding, not part of the product.
 */
export default function ComponentGallery() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chips, setChips] = useState(["Technology", "Business", "Science"]);

  return (
    <>
      <Head>
        <title>UI primitives — News Aggregator</title>
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">UI primitives</h1>
            <p className="mt-2 text-muted-text">
              Every component below is built from semantic tokens, so it follows the
              theme without a single <code className="font-mono text-sm">dark:</code>{" "}
              class.
            </p>
          </div>

          <ThemeToggle />
        </header>

        <Section title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
            <Button icon={<Search className="size-4" />}>With icon</Button>
            <Button
              variant="secondary"
              icon={<Bookmark className="size-4" />}
              iconPosition="right"
            >
              Icon right
            </Button>
            <Button
              variant="ghost"
              size="square-icon"
              rounded="circle"
              aria-label="Search"
              icon={<Search className="size-4" />}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Input & Select">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Search articles"
              placeholder="Search by keyword…"
              icon={<Search className="size-4" />}
            />
            <Input label="From date" type="date" />
            <Input
              label="With error"
              defaultValue="not-an-email"
              error="Enter a valid value."
            />
            <Select label="Source" placeholder="Any source" options={SOURCES} />
          </div>
        </Section>

        <Section title="Checkbox">
          <div className="flex flex-col gap-3">
            <Checkbox label="The Guardian" description="Open Platform API" defaultChecked />
            <Checkbox label="New York Times" description="Article Search API" />
            <Checkbox label="Unavailable source" description="No public API" disabled />
          </div>
        </Section>

        <Section title="Chip">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>Default</Chip>
            <Chip variant="active">Active</Chip>
            <Chip variant="danger">Danger</Chip>
            <Chip variant="success">Success</Chip>
            <Chip variant="info">Info</Chip>
          </div>

          <p className="mt-4 mb-2 text-sm text-muted-text">
            Removable — the active-filter pattern:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <Chip
                key={chip}
                variant="active"
                removeLabel={`Remove ${chip}`}
                onRemove={() => setChips((current) => current.filter((c) => c !== chip))}
              >
                {chip}
              </Chip>
            ))}
            {chips.length === 0 ? (
              <Button size="sm" variant="ghost" onClick={() => setChips(["Technology", "Business", "Science"])}>
                Reset
              </Button>
            ) : null}
          </div>
        </Section>

        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="font-medium">Surface</p>
              <p className="mt-1 text-sm text-muted-text">The default article card.</p>
            </Card>
            <Card variant="sunken">
              <p className="font-medium">Sunken</p>
              <p className="mt-1 text-sm text-muted-text">Recedes from the page.</p>
            </Card>
            <Card isInteractive>
              <p className="font-medium">Interactive</p>
              <p className="mt-1 text-sm text-muted-text">Hover me.</p>
            </Card>
          </div>
        </Section>

        <Section title="Skeleton & Spinner">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <div className="flex gap-3">
                <Skeleton shape="circle" />
                <div className="flex-1">
                  <Skeleton shape="text" lines={3} />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex h-full items-center justify-center gap-4">
                <Spinner size="xs" />
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </Card>
          </div>
        </Section>

        <Section title="EmptyState">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="none">
              <EmptyState
                icon={<Newspaper className="size-8" />}
                title="No articles found"
                description="Try a different keyword, or widen the date range."
                action={<Button variant="secondary" size="sm">Clear filters</Button>}
              />
            </Card>
            <Card padding="none">
              <EmptyState
                variant="danger"
                icon={<TriangleAlert className="size-8" />}
                title="Could not reach The Guardian"
                description="The other sources are still shown below."
                action={<Button size="sm">Retry</Button>}
              />
            </Card>
          </div>
        </Section>

        <Section title="Drawer">
          <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
            Open filters
          </Button>

          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Filters"
          >
            <div className="flex flex-col gap-4">
              <Input label="Keyword" placeholder="Search…" icon={<Search className="size-4" />} />
              <Select label="Source" placeholder="Any source" options={SOURCES} />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Categories</p>
                <Checkbox label="Technology" checkboxSize="sm" defaultChecked />
                <Checkbox label="Business" checkboxSize="sm" />
                <Checkbox label="Science" checkboxSize="sm" />
              </div>
              <Button onClick={() => setIsDrawerOpen(false)}>Apply</Button>
            </div>
          </Drawer>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-subtle-text">
        {title}
      </h2>
      {children}
    </section>
  );
}
