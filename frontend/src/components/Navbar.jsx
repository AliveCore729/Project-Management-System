import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, Bell, Menu } from "lucide-react"; // Added standard icons
import ProfileDropdown from "./ProfileDropdown";
import DarkModeToggle from "./DarkModeToggle";
import API from "../api";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ teacher, onCreate, onSelectGroup, onLogout }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ groups: [], students: [] });
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  async function handleSearch(q) {
    setQuery(q);
    if (!q.trim()) {
      setResults({ groups: [], students: [] });
      return;
    }

    try {
      const res = await API.get(`/search?q=${q}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800 h-16 transition-all duration-300">
      <div className="w-full h-full px-4 flex items-center justify-between gap-4">

        {/* Logo Area */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/30">
              P
            </div>
            <span className="hidden md:block font-bold text-lg text-gray-800 dark:text-white tracking-tight">
              Project Management
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative" ref={searchRef}>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              value={query}
              onChange={(e) => {
                handleSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search projects, groups or students..."
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       rounded-full pl-10 pr-12 py-2.5 
                       border-2 border-transparent focus:bg-white dark:focus:bg-gray-800 
                       focus:border-red-100 dark:focus:border-red-900/30 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/10 
                       transition-all outline-none placeholder-gray-500"
            />
            {/* Mic Icon */}
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              <Mic size={16} />
            </button>
          </div>

          {/* 🔍 SEARCH DROPDOWN */}
          <AnimatePresence>
            {open && (results.groups?.length > 0 || results.students?.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute mt-2 w-full bg-white dark:bg-gray-800 
                           shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-2 z-50 overflow-hidden"
              >
                {/* Groups */}
                {results.groups.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                      Groups
                    </div>
                    {results.groups.map((g) => (
                      <div
                        key={g._id}
                        onClick={() => {
                          onSelectGroup(g);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-200
                                   rounded-xl cursor-pointer transition-colors text-sm font-medium"
                      >
                        {g.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* Students */}
                {results.students.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2 mt-2">
                      Students
                    </div>
                    {results.students.map((s) => (
                      <div
                        key={s.regNo}
                        className="px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-200
                                   rounded-xl cursor-pointer transition-colors text-sm font-medium"
                        onClick={async () => {
                          const res = await API.get(`/student/${s.regNo}/group`);
                          const group = res.data.group;

                          if (group) {
                            onSelectGroup(group);
                          } else {
                            alert("This student is not assigned to any group.");
                          }

                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        {s.name} <span className="text-gray-400 text-xs">({s.regNo})</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onCreate}
            className="hidden md:flex items-center gap-2 px-4 py-2 
                       rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900
                       font-medium text-sm hover:shadow-lg hover:scale-105 transition-all"
          >
            + Create
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
          
          <DarkModeToggle />
          <ProfileDropdown teacher={teacher} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
