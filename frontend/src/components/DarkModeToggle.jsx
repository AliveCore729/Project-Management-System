// frontend/src/components/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";


export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pm_theme");

    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefers);
      if (prefers) document.documentElement.classList.add("dark");
    }
  }, []);
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("pm_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pm_theme", "light");
    }
  }, [isDark]);

  return (
    <motion.button
      onClick={() => setIsDark((prev) => !prev)}
      aria-label="Toggle dark mode"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 flex items-center justify-center shadow-sm
                 text-gray-700 dark:text-gray-200"
    >
      <motion.div
        key={isDark ? "sun" : "moon"}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </motion.button>
  );
}
