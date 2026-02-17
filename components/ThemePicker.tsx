"use client";

import { useTheme } from "@/components/ThemeProvider";
import { DEFAULT_THEME, THEMES, THEME_GROUPS, type ThemeName } from "@/lib/themes";

export function ThemePicker() {
  const { theme, setTheme, resetTheme } = useTheme();

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Theme Picker</h1>
          <p className="text-sm text-muted-foreground">
            Select one of 12 global themes (6 cozy light + 6 dark). Changes apply instantly.
          </p>
        </div>
        <button
          type="button"
          onClick={resetTheme}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          disabled={theme === DEFAULT_THEME}
        >
          Reset to Default
        </button>
      </div>

      <div className="space-y-6">
        {(
          [
            ["Light Cozy Themes", THEME_GROUPS.light],
            ["Dark Themes", THEME_GROUPS.dark],
          ] as const
        ).map(([title, names]) => (
          <div key={title}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {names.map((name: ThemeName) => {
          const tokens = THEMES[name];
          const selected = theme === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setTheme(name)}
              className={`rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-accent"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">{tokens.label}</p>
                {selected && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    Active
                  </span>
                )}
              </div>
              <div className="flex gap-2" aria-hidden="true">
                <span
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: tokens.background }}
                />
                <span
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: tokens.surface }}
                />
                <span
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: tokens.primary }}
                />
                <span
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: tokens.accent }}
                />
              </div>
            </button>
          );
        })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
