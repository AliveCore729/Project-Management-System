import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

function getInitialTheme() {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark");
  }

  return false;
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  localStorage.setItem("pm_theme", isDark ? "dark" : "light");
}

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  return (
    <motion.button
      type="button"
      onClick={() => setIsDark((current) => !current)}
      aria-label="Toggle dark mode"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
      className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] text-slate-700 shadow-[0_14px_24px_-20px_rgba(35,26,16,0.65)] transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
    >
      <motion.div
        key={isDark ? "sun" : "moon"}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </motion.button>
  );
}
