// frontend/src/components/GroupCard.jsx
import React, { useState } from "react";
import API from "../api";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupCard({ group, onOpen, onRefresh }) {
    const [menuOpen, setMenuOpen] = useState(false);

    async function editTitle() {
        const newTitle = prompt("Enter new group title:", group.title);
        if (!newTitle || newTitle === group.title) return;

        await API.post(`/groups/${group._id}/edit`, { title: newTitle });
        if (onRefresh) onRefresh();
    }

    async function editSubtitle() {
        const newSubtitle = prompt("Enter new group subtitle:", group.subtitle);
        if (!newSubtitle || newSubtitle === group.subtitle) return;

        await API.post(`/groups/${group._id}/edit`, { subtitle: newSubtitle });
        if (onRefresh) onRefresh();
    }

    async function deleteGroup() {
        if (!window.confirm(`Delete group "${group.title}"?`)) return;

        await API.delete(`/groups/${group._id}`);
        if (onRefresh) onRefresh();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.22 }}
            className="relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden cursor-pointer"
        >
            <div
                className="h-32 w-full"
                style={{
                    background: group.banner || "#60A5FA",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
                onClick={onOpen}
            ></div>

            {/* 🔥 CONTENT LIKE YOUTUBE VIDEO CARD */}
            <div className="p-4" onClick={onOpen}>
                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                    {group.title}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-1">
                    {group.subtitle}
                </p>

                <div className="text-xs mt-3 text-gray-500">
                    Members: <span className="font-medium">{group.studentRegs?.length || 0}</span>
                </div>

                <div className="text-xs text-gray-500">
                    Group marks: {group.groupMarks ?? "-"}
                </div>
            </div>

            {/* THREE DOT MENU (YouTube Style) */}
            <button
                type="button"
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 transition"
                onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                }}
            >
                <MoreVertical size={20} className="text-white drop-shadow-md" />
            </button>

            {/* 🔥 YOUTUBE-STYLE MENU */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-12 right-3 bg-white text-black rounded-xl shadow-2xl border w-44 z-40"
                    >
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                editTitle();
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                        >
                            ✏ Edit Title
                        </button>

                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                editSubtitle();
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                        >
                            📝 Edit Subtitle
                        </button>

                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                deleteGroup();
                            }}
                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
                        >
                            🗑 Delete Group
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
