import React, { useEffect, useState } from "react";
import API from "../api";
import GroupModal from "./GroupModal";
import ProfileDropdown from "./ProfileDropdown";
import GroupCard from "./GroupCard";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import SkeletonGrid from "./SkeletonGrid";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard({ teacher }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  function openGroupFromNavbar(group) {
    setActive(group);
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await API.get("/groups");
      setGroups(res.data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
    setLoading(false);
  }

  async function createGroup() {
    const title = prompt("Group title");
    if (!title) return;

    const subtitle = prompt("Subtitle") || "";
    const banner = "#60A5FA";

    try {
      const res = await API.post("/groups", {
        title,
        subtitle,
        banner,
      });

      setGroups((prev) => [res.data, ...prev]);
    } catch (err) {
      alert("Cannot create group.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-red-100 dark:selection:bg-red-900/30">

      {/* Navbar Fixed */}
      <Navbar teacher={teacher} onCreate={createGroup} onSelectGroup={(g) => setActive(g)} />

      <div className="flex pt-16">

        {/* Sidebar Fixed */}
        <Sidebar />

        {/* MAIN CONTENT – Wrapper to handle sidebar width spacing */}
        <main className="flex-1 ml-[70px] p-6 md:p-10 transition-all duration-300 max-w-[1920px] mx-auto">

          {/* Header Section */}
          <motion.div
            className="mb-8 flex flex-col gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Welcome, {teacher.name}
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <span className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-md shadow-sm">
                Teacher ID: {teacher.teacherId}
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* LEFT SIDE: PROJECT GRID */}
            <div className="flex-1">
              
              {loading ? (
                <SkeletonGrid count={8} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  
                  {/* CREATE NEW GROUP BUTTON - STYLED */}
                  <motion.div
                    onClick={createGroup}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      group cursor-pointer
                      flex flex-col items-center justify-center gap-4
                      min-h-[220px] rounded-2xl
                      border-2 border-dashed border-gray-300 dark:border-gray-700
                      bg-white/50 dark:bg-gray-900/50
                      hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-300 dark:hover:border-red-700
                      transition-all duration-200
                    "
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">
                      <span className="text-3xl text-gray-400 group-hover:text-red-500 transition-colors pb-1">+</span>
                    </div>
                    <span className="font-semibold text-gray-500 group-hover:text-red-600 dark:text-gray-400 dark:group-hover:text-red-400">
                      Create Project
                    </span>
                  </motion.div>

                  {/* EXISTING GROUPS */}
                  <AnimatePresence>
                    {groups.map((g, index) => (
                      <motion.div
                        key={g._id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <GroupCard
                          group={g}
                          onOpen={() => setActive(g)}
                          onRefresh={fetchGroups}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: ANNOUNCEMENTS PANEL */}
            <aside className="hidden xl:block w-80 shrink-0">
              <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">Announcements</h3>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                
                <div className="space-y-4">
                  {/* Placeholder announcement items since data wasn't provided, keeping layout intact */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">No new announcements today.</p>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </main>
      </div>

      {/* GROUP MODAL */}
      {active && (
        <GroupModal
          group={active}
          onClose={() => {
            setActive(null);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}