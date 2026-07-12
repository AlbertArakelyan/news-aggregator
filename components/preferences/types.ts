import { ISourceOption } from "@/components/filters/types";
import { Preferences } from "@/lib/preferences";

export interface IPreferencesPanelProps {
  preferences: Preferences;
  sourceOptions: ISourceOption[];
  onChange: (next: Preferences) => void;
}

export interface IPreferencesButtonProps {
  sourceOptions: ISourceOption[];
}
