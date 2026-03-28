import React, { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

import API from "../api";
import DarkModeToggle from "./DarkModeToggle";
import ProfileDropdown from "./ProfileDropdown";

export default function Navbar({
  teacher,
  onCreate,
  onSelectGroup,
  onLogout,
  viewLabel = "Dashboard",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ groups: [], students: [] });
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  async function handleSearch(nextQuery) {
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setResults({ groups: [], students: [] });
      return;
    }

    try {
      const response = await API.get(`/search?q=${nextQuery}`);
      setResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  useEffect(() => {
    function handleClick(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function openStudentGroup(student) {
    try {
      const response = await API.get(`/student/${student.regNo}/group`);
      const nextGroup = response.data.group;

      if (nextGroup) {
        onSelectGroup(nextGroup);
      } else {
        toast.error("This student is not assigned to any group");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Unable to open this student right now");
    } finally {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(232,221,209,0.9)] bg-[rgba(255,251,246,0.92)] backdrop-blur-xl dark:border-slate-800 dark:bg-[rgba(11,10,18,0.9)] lg:left-[108px] xl:left-[280px]">
      <div className="mx-auto flex h-[82px] max-w-[1680px] items-center gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            {viewLabel}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[#94867b] dark:text-slate-400">
            <span className="text-[#b39f8e] dark:text-slate-500">ProjectX</span>
            <span>&gt;</span>
            <span>{viewLabel}</span>
          </div>
        </div>

        <div className="relative hidden max-w-2xl flex-1 lg:block" ref={searchRef}>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b2a395] dark:text-slate-500"
            />
            <input
              value={query}
              onChange={(event) => {
                handleSearch(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search tasks, groups, students..."
              className="w-full rounded-[18px] border border-[#e5d9cc] bg-[#fbf6ef] py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:bg-white focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:bg-slate-950 dark:focus:ring-slate-800"
            />
          </div>

          <AnimatePresence>
            {open && (results.groups?.length > 0 || results.students?.length > 0) ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute mt-3 w-full overflow-hidden rounded-[24px] border border-[#e5d9cc] bg-[rgba(255,252,247,0.98)] p-2 shadow-[0_30px_70px_-38px_rgba(35,26,16,0.35)] dark:border-slate-800 dark:bg-slate-950/96"
              >
                {results.groups.length > 0 ? (
                  <div>
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#94867b] dark:text-slate-400">
                      Groups
                    </div>
                    {results.groups.map((group) => (
                      <button
                        key={group._id}
                        type="button"
                        onClick={() => {
                          onSelectGroup(group);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-[#fbf2f5] hover:text-[#f05c87] dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
                      >
                        <span>{group.title}</span>
                        <span className="text-xs text-[#b09f91] dark:text-slate-500">
                          {group.studentRegs?.length || 0} students
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {results.students.length > 0 ? (
                  <div className={results.groups.length > 0 ? "mt-1" : ""}>
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#94867b] dark:text-slate-400">
                      Students
                    </div>
                    {results.students.map((student) => (
                      <button
                        key={student.regNo}
                        type="button"
                        onClick={() => openStudentGroup(student)}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-[#fbf2f5] hover:text-[#f05c87] dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
                      >
                        <span className="truncate">
                          {student.name}{" "}
                          <span className="text-xs text-[#b09f91] dark:text-slate-500">
                            ({student.regNo})
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-[16px] border border-[#f2d7e1] bg-[#fff3f7] px-3.5 py-2.5 text-sm font-semibold text-[#b43f6b] transition hover:bg-[#ffe7f0] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Group</span>
          </button>
          <DarkModeToggle />
          <ProfileDropdown teacher={teacher} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
