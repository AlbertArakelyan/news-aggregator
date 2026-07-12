import { Plus } from "lucide-react";
import { useState } from "react";

import Button from "@/components/UI/Button/Button";
import CheckboxGroup from "@/components/UI/CheckboxGroup/CheckboxGroup";
import Chip from "@/components/UI/Chip/Chip";
import Input from "@/components/UI/Input/Input";
import { CATEGORY_IDS, CategoryId, SourceId } from "@/lib/sources/types";

import { IPreferencesPanelProps } from "./types";

const CATEGORY_OPTIONS = CATEGORY_IDS.map((id) => ({ value: id, label: id }));

/**
 * Preferred sources, categories and authors.
 *
 * Presentational: it edits the object it is handed and reports every change
 * upward. Persistence and the URL are somebody else's job.
 */
const PreferencesPanel = ({
  preferences,
  sourceOptions,
  onChange,
}: IPreferencesPanelProps) => {
  const [authorDraft, setAuthorDraft] = useState("");

  const addAuthor = () => {
    const author = authorDraft.trim();

    // Case-insensitive: "Jane Doe" and "jane doe" are one author, and the filter
    // matches case-insensitively too.
    const isDuplicate = preferences.authors.some(
      (existing) => existing.toLowerCase() === author.toLowerCase(),
    );

    if (!author || isDuplicate) {
      setAuthorDraft("");

      return;
    }

    onChange({ ...preferences, authors: [...preferences.authors, author] });
    setAuthorDraft("");
  };

  return (
    <div className="flex flex-col gap-6">
      <CheckboxGroup<SourceId>
        legend="Preferred sources"
        options={sourceOptions.map((source) => ({
          value: source.id,
          label: source.name,
        }))}
        selected={preferences.sources}
        onChange={(sources) => onChange({ ...preferences, sources })}
      />

      <CheckboxGroup<CategoryId>
        legend="Preferred categories"
        options={CATEGORY_OPTIONS}
        selected={preferences.categories}
        onChange={(categories) => onChange({ ...preferences, categories })}
        optionLabelClassName="capitalize"
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium text-text-color">
          Preferred authors
        </legend>

        {/*
          Free text, because no provider offers a list of authors to choose from.
          The filter matches a substring, case-insensitively, so a partial name
          still works.
        */}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addAuthor();
          }}
        >
          <Input
            label="Add an author"
            placeholder="e.g. Jane Doe"
            inputElSize="sm"
            value={authorDraft}
            onChange={(event) => setAuthorDraft(event.target.value)}
          />

          <Button
            type="submit"
            size="square-icon"
            variant="secondary"
            aria-label="Add author"
            icon={<Plus className="size-4" />}
          />
        </form>

        {preferences.authors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {preferences.authors.map((author) => (
              <Chip
                key={author}
                chipSize="sm"
                removeLabel={`Remove ${author}`}
                onRemove={() =>
                  onChange({
                    ...preferences,
                    authors: preferences.authors.filter(
                      (name) => name !== author,
                    ),
                  })
                }
              >
                {author}
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-text">No preferred authors yet.</p>
        )}
      </fieldset>
    </div>
  );
};

export default PreferencesPanel;
