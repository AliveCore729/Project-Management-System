// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Search, Mic } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import DarkModeToggle from "./DarkModeToggle";
import API from "../api";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ teacher, onCreate, onSelectGroup }) {
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
    <header className="w-full bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40 border-b">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg width="36" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#FF0000"></rect>
            <path d="M10 7.5v9l7-4.5-7-4.5z" fill="#fff"></path>
          </svg>
          <div className="hidden md:block text-lg font-semibold dark:text-white">
            Project Management
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 relative" ref={searchRef}>
          <input
            value={query}
            onChange={(e) => {
              handleSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search projects, groups or students..."
            className="w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-200
                       rounded-full pl-4 pr-12 py-2 focus:outline-none 
                       focus:ring-2 focus:ring-blue-300"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <Mic size={16} />
            </button>
            <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
              <Search size={16} />
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
                           shadow-lg rounded-xl p-3 z-50"
              >
                {/* Groups */}
                {results.groups.length > 0 && (
                  <>
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Groups
                    </div>
                    {results.groups.map((g) => (
                      <div
                        key={g._id}
                        onClick={() => {
                          onSelectGroup(g);   // open modal
                          setOpen(false);     // close dropdown
                          setQuery("");       // clear search box
                        }}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700
                                   rounded cursor-pointer"
                      >
                        {g.title}
                      </div>
                    ))}
                  </>
                )}

                {/* Students */}
                {results.students.length > 0 && (
                  <>
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-2">
                      Students
                    </div>
                    {results.students.map((s) => (
                      <div
                        key={s.regNo}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700
                                   rounded cursor-pointer"
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
                        {s.name} ({s.regNo})
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCreate}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 
                       rounded-lg border dark:border-gray-700 
                       hover:shadow-sm dark:text-white"
          >
            + Create
          </button>

          <DarkModeToggle />
          <ProfileDropdown teacher={teacher} />
        </div>
      </div>
    </header>
  );
}
