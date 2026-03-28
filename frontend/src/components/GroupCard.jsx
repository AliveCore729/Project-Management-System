import React, { useState } from "react";
import API from "../api";
import {
  MoreVertical,
  PencilLine,
  Signature,
  Trash2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

import AppDialog from "./AppDialog";

function getProgressValue(groupMarks) {
  const numericValue = Number(groupMarks);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
}

export default function GroupCard({ group, onOpen, onRefresh }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const progress = getProgressValue(group.groupMarks);

  function openEditDialog(type) {
    setMenuOpen(false);
    setDialog(type);
    setDraftValue(type === "title" ? group.title || "" : group.subtitle || "");
  }

  function openDeleteDialog() {
    setMenuOpen(false);
    setDialog("delete");
    setDraftValue("");
  }

  function closeDialog() {
    if (submitting) return;
    setDialog(null);
    setDraftValue("");
  }

  async function submitDialog() {
    if (!dialog) return;

    setSubmitting(true);

    try {
      if (dialog === "title" || dialog === "subtitle") {
        const nextValue = draftValue.trim();
        if (!nextValue) {
          toast.error(`Enter a ${dialog}`);
          setSubmitting(false);
          return;
        }

        await API.post(`/groups/${group._id}/edit`, { [dialog]: nextValue });
        toast.success(`Group ${dialog} updated`);
      }

      if (dialog === "delete") {
        await API.delete(`/groups/${group._id}`);
        toast.success("Group deleted");
      }

      closeDialog();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Action failed");
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative overflow-hidden rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] shadow-[0_24px_60px_-38px_rgba(35,26,16,0.3)] dark:border-slate-800 dark:bg-slate-950/90"
      >
        <div
          className="h-[4px] w-full"
          style={{
            background: group.banner || "linear-gradient(90deg, #f05c87, #35c7f3, #f3b14b)",
          }}
        />

        <button type="button" onClick={onOpen} className="block w-full p-5 text-left">
          <div className="pr-12">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
              <span className="h-2 w-2 rounded-full bg-[#f05c87]" />
              Group
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {group.title}
            </h3>
            <div className="mt-1 min-h-[20px] text-sm text-[#8b7e73] dark:text-slate-400">
              {group.subtitle || "No subtitle"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-[#efe4da] dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f05c87] via-[#35c7f3] to-[#f3b14b]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-[#8b7e73] dark:text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f7efe6] px-3 py-1.5 dark:bg-slate-900">
                  <Users size={13} />
                  {group.studentRegs?.length || 0} students
                </span>
                <span className="rounded-full bg-[#f7efe6] px-3 py-1.5 dark:bg-slate-900">
                  {group.groupMarks ?? "-"} marks
                </span>
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {group.groupMarks ?? "-"}%
            </div>
          </div>
        </button>

        <button
          type="button"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-[16px] border border-[#eaded2] bg-[#fff8f0] text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((current) => !current);
          }}
        >
          <MoreVertical size={18} />
        </button>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ duration: 0.16 }}
              onClick={(event) => event.stopPropagation()}
              className="absolute right-4 top-16 z-40 w-48 overflow-hidden rounded-[20px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.98)] p-2 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.32)] dark:border-slate-800 dark:bg-slate-950/96"
            >
              <button
                type="button"
                onClick={() => openEditDialog("title")}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#fbf2f5] hover:text-[#b43f6b] dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                <PencilLine size={16} />
                Edit Title
              </button>

              <button
                type="button"
                onClick={() => openEditDialog("subtitle")}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#fbf2f5] hover:text-[#b43f6b] dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                <Signature size={16} />
                Edit Subtitle
              </button>

              <button
                type="button"
                onClick={openDeleteDialog}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-[#fff1f4] dark:hover:bg-slate-900"
              >
                <Trash2 size={16} />
                Delete Group
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <AppDialog
        open={Boolean(dialog)}
        title={
          dialog === "title"
            ? "Edit Title"
            : dialog === "subtitle"
              ? "Edit Subtitle"
              : "Delete Group"
        }
        description={
          dialog === "delete"
            ? `This will remove "${group.title}" permanently.`
            : "Update the group details."
        }
        onClose={closeDialog}
        actions={
          <>
            <button
              type="button"
              onClick={closeDialog}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDialog}
              disabled={submitting}
              className={`inline-flex items-center justify-center rounded-[16px] px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                dialog === "delete"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-[#f05c87] hover:bg-[#d84f77]"
              }`}
            >
              {submitting
                ? dialog === "delete"
                  ? "Deleting..."
                  : "Saving..."
                : dialog === "delete"
                  ? "Delete"
                  : "Save"}
            </button>
          </>
        }
      >
        {dialog === "delete" ? (
          <div className="rounded-[18px] border border-[#ece1d6] bg-[#fcf8f1] px-4 py-4 text-sm text-[#8b7e73] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            You can’t undo this action later.
          </div>
        ) : (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7e73] dark:text-slate-400">
              {dialog === "title" ? "Group Title" : "Subtitle"}
            </span>
            <input
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              placeholder={dialog === "title" ? "AI Lab Team" : "Final year project group"}
              className="w-full rounded-[16px] border border-[#e6dbcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
            />
          </label>
        )}
      </AppDialog>
    </>
  );
}
