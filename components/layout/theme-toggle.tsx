"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

function disableTransitionsTemporarily(): () => void {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none!important}"),
  );

  document.head.appendChild(style);

  return () => {
    // Force style recalculation so the class change is committed before restoring transitions.
    window.getComputedStyle(document.body);
    window.requestAnimationFrame(() => {
      style.remove();
    });
  };
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<ThemeMode>("light");

  const applyTheme = React.useCallback(
    (nextTheme: ThemeMode, { persist = true }: { persist?: boolean } = {}) => {
      const restoreTransitions = disableTransitionsTemporarily();

      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      if (persist) {
        window.localStorage.setItem("theme", nextTheme);
      }

      restoreTransitions();
    },
    [],
  );

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme") as ThemeMode | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const nextTheme = savedTheme ?? (prefersDark ? "dark" : "light");

    setTheme(nextTheme);
    applyTheme(nextTheme, { persist: false });
  }, [applyTheme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, [applyTheme]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={toggleTheme}
      aria-label="Đổi chế độ sáng tối"
    >
      {theme === "light" ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
    </Button>
  );
}
