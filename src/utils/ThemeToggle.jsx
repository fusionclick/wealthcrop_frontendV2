import { useLayoutEffect, useState } from "react";

export default function ThemeToggle() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // null = not initialized yet
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || null;
    } catch {
      return null;
    }
  });

  // Initialize theme
  useLayoutEffect(() => {
    if (theme === null) {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, [theme]);

  // Apply theme
  useLayoutEffect(() => {
    if (!theme) return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      onClick={toggle}
      aria-pressed={theme === "dark"}
      title="Toggle theme"
      className={`
        p-2 rounded-full transition
        text-black dark:text-white

        ${
          token
            ? `
              hover:bg-gray-200 dark:hover:bg-gray-800
            `
            : `
              hover:bg-gray-100 dark:hover:bg-white/5
            `
        }
      `}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
