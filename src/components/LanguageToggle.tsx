"use client";

import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useAppStore();

  const toggleLang = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  return (
    <button
      onClick={toggleLang}
      className="inline-flex items-center gap-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm font-medium"
      aria-label="Toggle language"
    >
      <Languages className="h-[1.2rem] w-[1.2rem]" />
      <span className="hidden sm:inline-block">
        {language === "hi" ? "English" : "हिंदी"}
      </span>
    </button>
  );
}
