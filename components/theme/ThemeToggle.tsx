import { Monitor, Moon, Sun } from "lucide-react";

import Button from "@/components/UI/Button/Button";
import useTheme from "@/hooks/useTheme";
import { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Lives here, not in components/UI: it reads and writes theme state, and UI
 * primitives are presentational and stateless by rule.
 */
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex gap-1 rounded-lg border border-border-color bg-surface p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          aria-label={label}
          title={label}
          icon={<Icon className="size-4" aria-hidden="true" />}
        />
      ))}
    </div>
  );
};

export default ThemeToggle;
