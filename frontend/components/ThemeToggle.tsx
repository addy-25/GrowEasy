"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  // Read the class the inline <script> in layout.tsx already applied,
  // so the button state matches reality after hydration.
  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      title="Toggle light/dark mode"
      className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full glass text-lg transition-transform hover:scale-110"
    >
      {light ? "🌙" : "☀️"}
    </button>
  );
}
