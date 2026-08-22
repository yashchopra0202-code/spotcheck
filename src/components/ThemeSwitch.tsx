"use client";
import { useFunnel, type Theme } from "@/components/FunnelProvider";

// Each swatch previews its own theme (surface + brand dot) so the control is
// self-explanatory regardless of the active theme. Colors are literal token
// values, not var(), so they render in their own theme's palette.
const SWATCHES: { theme: Theme; label: string; surface: string; brand: string }[] = [
  { theme: "light", label: "Light theme", surface: "#FFFFFF", brand: "#0E7C66" },
  { theme: "dark", label: "Dark theme", surface: "#161C27", brand: "#2FD1AC" },
  { theme: "indigo", label: "Indigo theme", surface: "#FFFFFF", brand: "#4F46E5" },
];

export default function ThemeSwitch() {
  const { theme, setTheme } = useFunnel();
  return (
    <div className="themeseg" role="group" aria-label="Colour theme">
      {SWATCHES.map((s) => (
        <button
          key={s.theme}
          type="button"
          className={`swatch${theme === s.theme ? " on" : ""}`}
          style={{ background: s.surface }}
          aria-label={s.label}
          aria-pressed={theme === s.theme}
          onClick={() => setTheme(s.theme)}
        >
          <span className="dot" style={{ background: s.brand }} />
        </button>
      ))}
    </div>
  );
}
