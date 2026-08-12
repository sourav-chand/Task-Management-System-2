"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 animate-pulse" />
    );
  }

  return (
    <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full p-1 shadow-xs">
      <button
        onClick={() => setTheme("light")}
        title="Light Theme"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs scale-105"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        title="Dark Theme"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs scale-105"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("system")}
        title="System Theme"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs scale-105"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
