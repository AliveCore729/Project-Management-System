import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, UserMinus, X } from "lucide-react";
import { toast } from "react-hot-toast";

import API from "../api";
import AppDialog from "./AppDialog";

function createEmptyRemoveDialog() {
  return {
    open: false,
    student: null,
    submitting: false,
  };
}

function createEmptyStudentMarksDialog() {
  return {
    open: false,
    student: null,
    value: "",
    submitting: false,
  };
}

export default function GroupModal({ group, onClose }) {
  const [groupInfo, setGroupInfo] = useState(group);
  const [students, setStudents] = useState([]);
  const [regNo, setRegNo] = useState("");
  const [removeDialog, setRemoveDialog] = useState(createEmptyRemoveDialog());
  const [studentMarksDialog, setStudentMarksDialog] = useState(
    createEmptyStudentMarksDialog()
  );
  const [groupMarksDialog, setGroupMarksDialog] = useState({
    open: false,
    value: "",
    submitting: false,
  });

  useEffect(() => {
    setGroupInfo(group);
    setRemoveDialog(createEmptyRemoveDialog());
    setStudentMarksDialog(createEmptyStudentMarksDialog());
    setGroupMarksDialog({
      open: false,
      value: group?.groupMarks ?? "",
      submitting: false,
    });
    fetchStudents();
  }, [group]);

  async function fetchStudents() {
    try {
      const res = await API.get(`/groups/${group._id}`);
      setGroupInfo(res.data.group || group);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Failed to load this group");
    }
  }

  async function addStudent() {
    if (!regNo.trim()) {
      toast.error("Enter a student regNo");
      return;
    }

    try {
      await API.post(`/groups/${group._id}/add-student`, { regNo: regNo.trim() });
      setRegNo("");
      toast.success("Student added");
      await fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add student");
    }
  }

  function openRemoveStudentDialog(student) {
    setRemoveDialog({
      open: true,
      student,
      submitting: false,
    });
  }

  function closeRemoveStudentDialog() {
    setRemoveDialog((current) =>
      current.submitting ? current : createEmptyRemoveDialog()
    );
  }

  async function confirmRemoveStudent() {
    if (!removeDialog.student) return;

    setRemoveDialog((current) => ({ ...current, submitting: true }));

    try {
      await API.post(`/groups/${group._id}/remove-student`, {
        regNo: removeDialog.student.regNo,
      });

      setStudents((prev) =>
        prev.filter((student) => student.regNo !== removeDialog.student.regNo)
      );
      setGroupInfo((current) => ({
        ...current,
        studentRegs: (current?.studentRegs || []).filter(
          (currentRegNo) => currentRegNo !== removeDialog.student.regNo
        ),
      }));
      toast.success("Student removed");
      setRemoveDialog(createEmptyRemoveDialog());
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to remove student");
      setRemoveDialog((current) => ({ ...current, submitting: false }));
    }
  }

  function openStudentMarksDialog(student) {
    setStudentMarksDialog({
      open: true,
      student,
      value: student?.marks ?? "",
      submitting: false,
    });
  }

  function closeStudentMarksDialog() {
    setStudentMarksDialog((current) =>
      current.submitting ? current : createEmptyStudentMarksDialog()
    );
  }

  async function saveStudentMarks() {
    const value = Number(studentMarksDialog.value);
    if (!Number.isFinite(value)) {
      toast.error("Enter a valid number");
      return;
    }

    setStudentMarksDialog((current) => ({ ...current, submitting: true }));

    try {
      await API.post(`/students/${studentMarksDialog.student.regNo}/add-mark`, {
        marks: value,
      });
      toast.success("Student marks updated");
      setStudentMarksDialog(createEmptyStudentMarksDialog());
      await fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update marks");
      setStudentMarksDialog((current) => ({ ...current, submitting: false }));
    }
  }

  function openGroupMarksDialog() {
    setGroupMarksDialog({
      open: true,
      value: groupInfo?.groupMarks ?? "",
      submitting: false,
    });
  }

  function closeGroupMarksDialog() {
    setGroupMarksDialog((current) =>
      current.submitting
        ? current
        : {
            open: false,
            value: groupInfo?.groupMarks ?? "",
            submitting: false,
          }
    );
  }

  async function saveGroupMarks() {
    const score = Number(groupMarksDialog.value);
    if (!Number.isFinite(score)) {
      toast.error("Enter a valid number");
      return;
    }

    setGroupMarksDialog((current) => ({ ...current, submitting: true }));

    try {
      await API.post(`/groups/${group._id}/set-marks`, { score });
      toast.success("Group marks updated");
      setGroupMarksDialog({
        open: false,
        value: score,
        submitting: false,
      });
      await fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to set group marks");
      setGroupMarksDialog((current) => ({ ...current, submitting: false }));
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(24,22,41,0.5)] p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.98)] shadow-[0_40px_100px_-52px_rgba(35,26,16,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
        >
          <div
            className="px-6 py-6"
            style={{
              background: "transparent",
            }}
          >
            <div
              className="mb-5 h-[4px] w-full rounded-full"
              style={{
                background:
                  groupInfo?.banner || "linear-gradient(90deg, #f05c87, #35c7f3, #f3b14b)",
              }}
            />
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
                    Group
                  </div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {groupInfo?.title}
                  </h2>
                  {groupInfo?.subtitle ? (
                    <p className="mt-2 max-w-2xl text-sm text-[#8b7e73] dark:text-slate-400">
                      {groupInfo.subtitle}
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-semibold text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
                  {(groupInfo?.studentRegs || []).length} members
                </span>
                <span className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-semibold text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
                  {groupInfo?.groupMarks ?? "-"} marks
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-[22px] border border-[#e6dbcf] bg-[#fbf6ef] p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b7e73] dark:text-slate-400">
                    Add Student
                  </h3>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="Enter student regNo"
                    className="w-full rounded-[16px] border border-[#e6dbcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
                  />
                  <button
                    onClick={addStudent}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#f05c87] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(240,92,135,0.75)] transition hover:bg-[#d84f77]"
                  >
                    <Plus size={16} />
                    Add Student
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={openGroupMarksDialog}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#e4d6c8] bg-[#fbf6ef] px-5 py-4 text-sm font-semibold text-slate-700 shadow-[0_20px_50px_-36px_rgba(35,26,16,0.24)] transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
                >
                  <Star size={16} />
                  Update Group Marks
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] p-5 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] dark:border-slate-800 dark:bg-slate-950/92">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Student Roster
                </h3>
                <div className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-semibold text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
                  {students.length} listed
                </div>
              </div>

              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                {students.length === 0 && (
                  <div className="rounded-[20px] border border-dashed border-[#dfd2c3] px-5 py-10 text-center text-sm text-[#8b7e73] dark:border-slate-700 dark:text-slate-400">
                    No students in this group yet.
                  </div>
                )}

                <AnimatePresence>
                  {students.map((student) => (
                    <motion.div
                      key={student.regNo}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4 rounded-[18px] border border-[#ece1d6] bg-[#fcf8f1] p-4 dark:border-slate-800 dark:bg-slate-900/90 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <div className="text-base font-semibold text-slate-900 dark:text-white">
                          {student.name} ({student.regNo})
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="rounded-full bg-white px-3 py-1.5 dark:bg-slate-950">
                            Marks: {student.marks ?? "-"}
                          </span>
                          {student.otherDetails?.branch ? (
                            <span className="rounded-full bg-white px-3 py-1.5 dark:bg-slate-950">
                              {student.otherDetails.branch}
                            </span>
                          ) : null}
                          {student.otherDetails?.year ? (
                            <span className="rounded-full bg-white px-3 py-1.5 dark:bg-slate-950">
                              Year {student.otherDetails.year}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openStudentMarksDialog(student)}
                          className="inline-flex items-center gap-2 rounded-[16px] border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
                        >
                          <Star size={16} />
                          Give Mark
                        </button>
                        <button
                          onClick={() => openRemoveStudentDialog(student)}
                          className="inline-flex items-center gap-2 rounded-[16px] bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                        >
                          <UserMinus size={16} />
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        <AppDialog
          open={removeDialog.open}
          title="Remove Student"
          description={`Remove ${
            removeDialog.student?.name || removeDialog.student?.regNo || "this student"
          } from ${groupInfo?.title || "this group"}?`}
          onClose={removeDialog.submitting ? undefined : closeRemoveStudentDialog}
          actions={
            <>
              <button
                type="button"
                onClick={closeRemoveStudentDialog}
                disabled={removeDialog.submitting}
                className="inline-flex items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveStudent}
                disabled={removeDialog.submitting}
                className="inline-flex items-center justify-center rounded-[16px] bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removeDialog.submitting ? "Removing..." : "Remove"}
              </button>
            </>
          }
        >
          <div className="rounded-[18px] border border-[#efe2d5] bg-[#fbf6ef] px-4 py-4 text-sm text-[#8b7e73] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            This only removes the student from the group. Their student record stays available.
          </div>
        </AppDialog>

        <AppDialog
          open={studentMarksDialog.open}
          title="Update Student Marks"
          description={`Set marks for ${
            studentMarksDialog.student?.name || studentMarksDialog.student?.regNo || "student"
          }.`}
          onClose={studentMarksDialog.submitting ? undefined : closeStudentMarksDialog}
          actions={
            <>
              <button
                type="button"
                onClick={closeStudentMarksDialog}
                disabled={studentMarksDialog.submitting}
                className="inline-flex items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStudentMarks}
                disabled={studentMarksDialog.submitting}
                className="inline-flex items-center justify-center rounded-[16px] bg-[#f05c87] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d84f77] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {studentMarksDialog.submitting ? "Saving..." : "Save Marks"}
              </button>
            </>
          }
        >
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7e73] dark:text-slate-400">
              Marks
            </span>
            <input
              type="number"
              value={studentMarksDialog.value}
              onChange={(event) =>
                setStudentMarksDialog((current) => ({
                  ...current,
                  value: event.target.value,
                }))
              }
              placeholder="Enter marks"
              className="w-full rounded-[16px] border border-[#e6dbcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
            />
          </label>
        </AppDialog>

        <AppDialog
          open={groupMarksDialog.open}
          title="Update Group Marks"
          description={`Set the overall score for ${groupInfo?.title || "this group"}.`}
          onClose={groupMarksDialog.submitting ? undefined : closeGroupMarksDialog}
          actions={
            <>
              <button
                type="button"
                onClick={closeGroupMarksDialog}
                disabled={groupMarksDialog.submitting}
                className="inline-flex items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveGroupMarks}
                disabled={groupMarksDialog.submitting}
                className="inline-flex items-center justify-center rounded-[16px] bg-[#f05c87] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d84f77] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {groupMarksDialog.submitting ? "Saving..." : "Save Score"}
              </button>
            </>
          }
        >
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7e73] dark:text-slate-400">
              Group Score
            </span>
            <input
              type="number"
              value={groupMarksDialog.value}
              onChange={(event) =>
                setGroupMarksDialog((current) => ({
                  ...current,
                  value: event.target.value,
                }))
              }
              placeholder="Enter score"
              className="w-full rounded-[16px] border border-[#e6dbcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
            />
          </label>
        </AppDialog>
      </motion.div>
    </AnimatePresence>
  );
}
