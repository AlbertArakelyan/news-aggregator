import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import Input from "@/components/UI/Input/Input";

import { ISearchInputProps } from "./types";

const DEBOUNCE_MS = 400;

/**
 * The only filter that needs local state.
 *
 * Every other control commits on a discrete change, but typing must not push a
 * URL — and so re-run getServerSideProps and hit three providers — on every
 * keystroke. The input is therefore local while typing, and pushed once typing
 * stops.
 */
const SearchInput = ({ value, onSearch }: ISearchInputProps) => {
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);

  // Adopt a value that changed from the outside — "Clear all", or the back
  // button restoring an earlier query.
  //
  // Adjusted *during render*, not in an effect. An effect would trip
  // react-hooks/set-state-in-effect (see hooks/CLAUDE.md), and remounting via a
  // `key` would steal focus mid-sentence.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = setTimeout(() => onSearch(draft), DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, value, onSearch]);

  return (
    <Input
      type="search"
      label="Search"
      placeholder="Search articles…"
      icon={<Search className="size-4" />}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
};

export default SearchInput;
