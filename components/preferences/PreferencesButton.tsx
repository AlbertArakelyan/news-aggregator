import { Star } from "lucide-react";
import { useState } from "react";

import Button from "@/components/UI/Button/Button";
import Drawer from "@/components/UI/Drawer/Drawer";
import useArticleFilters from "@/hooks/useArticleFilters";
import usePreferences from "@/hooks/usePreferences";
import { Preferences, preferencesToQuery } from "@/lib/preferences";

import PreferencesPanel from "./PreferencesPanel";
import { IPreferencesButtonProps } from "./types";

/**
 * Owns preference state and the Drawer; PreferencesPanel just renders controls.
 *
 * Saving applies the preferences as filters immediately, so "my feed" is the
 * same URL-driven feed with the reader's defaults in the address bar — not a
 * separate mode with its own state.
 */
const PreferencesButton = ({ sourceOptions }: IPreferencesButtonProps) => {
  const { preferences, isPersonalized, savePreferences, clearPreferences } =
    usePreferences();
  const { setFilters } = useArticleFilters();

  const [isOpen, setIsOpen] = useState(false);
  // Edited locally so a half-finished selection is not saved on every click.
  const [draft, setDraft] = useState<Preferences>(preferences);

  const open = () => {
    setDraft(preferences);
    setIsOpen(true);
  };

  const save = () => {
    savePreferences(draft);
    setFilters(preferencesToQuery(draft));
    setIsOpen(false);
  };

  const reset = () => {
    clearPreferences();
    setDraft({ sources: [], categories: [], authors: [] });
  };

  return (
    <>
      <Button
        variant={isPersonalized ? "primary" : "secondary"}
        icon={<Star className="size-4" />}
        onClick={open}
      >
        {isPersonalized ? "My feed" : "Personalize"}
      </Button>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Personalize your feed"
        side="right"
        drawerSize="lg"
      >
        <PreferencesPanel
          preferences={draft}
          sourceOptions={sourceOptions}
          onChange={setDraft}
        />

        <div className="mt-8 flex gap-3">
          {isPersonalized ? (
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
          ) : null}

          <Button className="flex-1" onClick={save}>
            Save and apply
          </Button>
        </div>
      </Drawer>
    </>
  );
};

export default PreferencesButton;
