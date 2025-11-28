// frontend/src/components/Dashboard.jsx
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* 🔥 FIXED YOUTUBE NAVBAR */}
      <Navbar teacher={teacher} onCreate={createGroup} onSelectGroup={(g) => setActive(g)} />

      {/* 🔥 FIXED SIDEBAR + MAIN AREA WRAPPER */}
      <div className="flex">

        {/* FIXED YouTube-style Sidebar */}
        <Sidebar />

        {/* MAIN CONTENT – shifts based on sidebar width */}
        <main
          className="
            flex-1 
            ml-16 
            group-hover:ml-64 
            transition-all 
            duration-300 
            px-6 
            pt-24
          "
        >

          {/* HEADER */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Welcome, {teacher.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Teacher ID: {teacher.teacherId}
            </p>
          </motion.div>

          {/* SKELETON LOADER OR GROUP LIST */}
          {loading ? (
            <SkeletonGrid count={8} />
          ) : (
            <div
              className="
              grid 
              grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 
              gap-6
            "
            >
              <AnimatePresence>
                {groups.map((g, index) => (
                  <motion.div
                    key={g._id}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
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

              {/* CREATE NEW GROUP BUTTON */}
              <motion.div
                onClick={createGroup}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="
                  rounded-xl 
                  border-2 
                  border-dashed 
                  border-gray-300
                  dark:border-gray-700
                  p-6 
                  flex 
                  items-center 
                  justify-center 
                  text-4xl 
                  text-gray-400 
                  hover:bg-gray-200 
                  dark:hover:bg-gray-700 
                  cursor-pointer 
                  transition
                "
              >
                +
              </motion.div>
            </div>
          )}
        </main>

        {/* RIGHT PANEL LIKE YOUTUBE */}
        <aside className="hidden xl:block w-80 pt-24 pr-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-gray-600 dark:text-gray-300">
            Announcements
          </div>
        </aside>

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
