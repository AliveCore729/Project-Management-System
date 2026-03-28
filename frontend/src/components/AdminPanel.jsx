import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

import API from "../api";
import AppDialog from "./AppDialog";
import DarkModeToggle from "./DarkModeToggle";
import ProfileDropdown from "./ProfileDropdown";
import SkeletonGrid from "./SkeletonGrid";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  `${buttonBase} bg-[#f05c87] text-white hover:bg-[#d84f77] shadow-[0_20px_40px_-24px_rgba(240,92,135,0.75)]`;
const secondaryButton =
  `${buttonBase} border border-[#e4d6c8] bg-[#fbf6ef] text-slate-700 hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:text-white`;
const dangerButton =
  `${buttonBase} bg-rose-600 text-white hover:bg-rose-700 shadow-[0_20px_40px_-24px_rgba(225,29,72,0.55)]`;

function cls(...values) {
  return values.filter(Boolean).join(" ");
}

function extractError(error, fallback) {
  return error?.response?.data?.error || fallback;
}

function makeTeacherDraft(teacher) {
  return {
    teacherId: teacher?.teacherId || "",
    name: teacher?.name || "",
    email: teacher?.email || "",
  };
}

function makeAdminDraft(admin) {
  return {
    name: admin?.name || "",
    email: admin?.email || "",
    isActive: admin?.isActive ?? true,
  };
}

function makeGroupDraft(group, teacherId = "") {
  return {
    title: group?.title || "",
    subtitle: group?.subtitle || "",
    banner: group?.banner || "#0F766E",
    teacherId: group?.teacherId || teacherId || "",
    groupMarks: group?.groupMarks ?? "",
  };
}

function makeStudentDraft(student, groupId = "") {
  return {
    regNo: student?.regNo || "",
    name: student?.name || "",
    email: student?.email || "",
    branch: student?.otherDetails?.branch || "",
    year: student?.otherDetails?.year || "",
    marks: student?.marks ?? "",
    groupId,
  };
}

function makeConfirmDialog() {
  return {
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    submitting: false,
    tone: "danger",
    onConfirm: null,
  };
}

function SectionCard({ title, eyebrow, description, actions, children, className }) {
  return (
    <div
      className={cls(
        "rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] p-5 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/92",
        className
      )}
    >
      {(title || eyebrow || actions || description) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cls(
        "w-full rounded-[16px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:bg-white focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:bg-slate-950 dark:focus:ring-slate-800",
        props.className
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={cls(
        "w-full rounded-[16px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#f0c7d5] focus:bg-white focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-700 dark:focus:bg-slate-950 dark:focus:ring-slate-800",
        props.className
      )}
    />
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#dfd2c3] px-5 py-10 text-center text-sm text-[#8b7e73] dark:border-slate-700 dark:text-slate-400">
      {message}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[22px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] shadow-[0_22px_50px_-36px_rgba(35,26,16,0.25)] dark:border-slate-800 dark:bg-slate-950/92"
    >
      <div className="h-[3px] w-full" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#a29386] dark:text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {note ? (
            <p className="mt-3 inline-flex rounded-full bg-[#f7efe6] px-2.5 py-1 text-[11px] font-semibold text-[#8d7f73] dark:bg-slate-900 dark:text-slate-400">
              {note}
            </p>
          ) : null}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-[16px] text-white shadow-[0_18px_40px_-24px_rgba(35,26,16,0.45)]"
          style={{ background: accent }}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function DataToolCard({ icon: Icon, label, title, description, children }) {
  return (
    <div className="rounded-[24px] border border-[#e6dbcf] bg-[#fbf6ef] p-5 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.16)] dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-[#b43f6b] shadow-[0_20px_40px_-32px_rgba(240,92,135,0.65)] dark:bg-slate-950 dark:text-white">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#a29386] dark:text-slate-500">
            {label}
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function TeacherEditor({ teacher, onSave, onDelete, onOpenStudents }) {
  const [draft, setDraft] = useState(makeTeacherDraft(teacher));

  useEffect(() => {
    setDraft(makeTeacherDraft(teacher));
  }, [teacher]);

  if (!teacher) {
    return (
      <SectionCard eyebrow="Teacher" title="Select a Teacher">
        <EmptyState message="Choose a teacher to begin." />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Teacher"
      title={teacher.name || "Unnamed Teacher"}
      actions={
        <>
          <button className={secondaryButton} onClick={onOpenStudents}>
            View Students
          </button>
          <button className={secondaryButton} onClick={() => onSave(teacher._id, draft)}>
            <Save size={16} />
            Save Teacher
          </button>
          <button
            className={dangerButton}
            disabled={teacher.groupCount > 0}
            onClick={() => onDelete(teacher)}
            title={
              teacher.groupCount > 0
                ? "Reassign or delete this teacher's groups before deleting the teacher."
                : "Delete teacher"
            }
          >
            <Trash2 size={16} />
            Delete Teacher
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Teacher ID">
          <Input
            value={draft.teacherId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, teacherId: event.target.value }))
            }
            placeholder="T-101"
          />
        </Field>
        <Field label="Name">
          <Input
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Faculty name"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="teacher@example.com"
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-[#f7efe6] px-3 py-2 dark:bg-slate-900">
          Groups: {teacher.groupCount}
        </span>
        <span className="rounded-full bg-[#f7efe6] px-3 py-2 dark:bg-slate-900">
          Students: {teacher.studentCount}
        </span>
        {teacher.groupCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            Delete unlocks after group reassignment
          </span>
        ) : null}
      </div>
    </SectionCard>
  );
}

function AdminEditorCard({ admin, onSave, onDelete, isBootstrap = false }) {
  const [draft, setDraft] = useState(makeAdminDraft(admin));

  useEffect(() => {
    setDraft(makeAdminDraft(admin));
  }, [admin]);

  return (
    <div className="rounded-[20px] border border-[#ece1d6] bg-[#fcf8f1] p-4 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            {admin.name || "Unnamed Admin"}
          </h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {admin.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cls(
              "rounded-full px-3 py-1.5 text-xs font-medium shadow-sm",
              admin.isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {admin.isActive ? "Active" : "Inactive"}
          </span>
          {isBootstrap ? (
            <span className="rounded-full border border-[#f0c7d5] bg-[#fff2f6] px-3 py-1.5 text-xs font-medium text-[#b43f6b] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              Recovery
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="Name">
          <Input
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Admin name"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="admin@example.com"
          />
        </Field>
        <Field label="Status">
          <Select
            value={draft.isActive ? "active" : "inactive"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                isActive: event.target.value === "active",
              }))
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={secondaryButton} onClick={() => onSave(admin._id, draft)}>
          <Save size={16} />
          Save Admin
        </button>
        <button className={dangerButton} onClick={() => onDelete(admin)}>
          <Trash2 size={16} />
          Delete Admin
        </button>
      </div>
    </div>
  );
}

function StudentEditorCard({
  student,
  assignedGroupId,
  groups,
  onSave,
  onDelete,
  onRemoveFromGroup,
  showGroupSelect = false,
  compact = false,
}) {
  const [draft, setDraft] = useState(makeStudentDraft(student, assignedGroupId || ""));
  const [expanded, setExpanded] = useState(!(showGroupSelect || compact));

  useEffect(() => {
    setDraft(makeStudentDraft(student, assignedGroupId || ""));
    setExpanded(!(showGroupSelect || compact));
  }, [student, assignedGroupId, showGroupSelect, compact]);

  const assignmentLabel =
    groups.find((group) => group._id === (showGroupSelect ? draft.groupId : assignedGroupId))
      ?.title || "Unassigned";

  const savePayload = {
    regNo: draft.regNo,
    name: draft.name,
    email: draft.email,
    branch: draft.branch,
    year: draft.year,
    marks: draft.marks,
    ...(showGroupSelect ? { groupId: draft.groupId } : {}),
  };

  return (
    <div className="rounded-[20px] border border-[#ece1d6] bg-[#fcf8f1] p-4 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            {student.name || "Unnamed Student"}
          </h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {student.regNo}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300">
            {assignmentLabel}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300">
            {student.marks ?? 0} marks
          </span>
          <button
            className={secondaryButton}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? "Collapse" : "Edit"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Reg No">
                  <Input
                    value={draft.regNo}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, regNo: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Name">
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Branch">
                  <Input
                    value={draft.branch}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, branch: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Year">
                  <Input
                    value={draft.year}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, year: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Marks">
                  <Input
                    type="number"
                    value={draft.marks}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, marks: event.target.value }))
                    }
                  />
                </Field>
              </div>

              {showGroupSelect ? (
                <Field label="Assigned Group">
                  <Select
                    value={draft.groupId}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, groupId: event.target.value }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.title}{" "}
                        {group.teacher ? `- ${group.teacher.name}` : "- Unassigned teacher"}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button className={secondaryButton} onClick={() => onSave(student.regNo, savePayload)}>
                  <Save size={16} />
                  Save Student
                </button>
                {onRemoveFromGroup ? (
                  <button className={secondaryButton} onClick={() => onRemoveFromGroup(student)}>
                    Remove From Group
                  </button>
                ) : null}
                <button className={dangerButton} onClick={() => onDelete(student)}>
                  <Trash2 size={16} />
                  Delete Student
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GroupEditorCard({
  group,
  teachers,
  allStudents,
  studentGroupLookup,
  groups,
  onSaveGroup,
  onDeleteGroup,
  onAddStudent,
  onRemoveStudent,
  onSaveStudent,
  onDeleteStudent,
}) {
  const [draft, setDraft] = useState(makeGroupDraft(group));
  const [selectedRegNo, setSelectedRegNo] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDraft(makeGroupDraft(group));
    setSelectedRegNo("");
    setExpanded(false);
  }, [group]);

  const candidateStudents = allStudents.filter(
    (student) => !group.studentRegs.includes(student.regNo)
  );
  const assignedTeacher =
    teachers.find((teacher) => teacher._id === (draft.teacherId || group.teacherId)) || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] dark:border-slate-800 dark:bg-slate-950/92"
    >
      <div
        className="h-[4px] w-full"
        style={{
          background:
            draft.banner || group.banner || "linear-gradient(90deg, #f05c87, #35c7f3, #f3b14b)",
        }}
      />

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
              Group
            </div>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {group.title || "Untitled Group"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {group.subtitle || "No subtitle yet"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-medium text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
              {group.students.length} members
            </span>
            <span className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-medium text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
              Score: {group.groupMarks ?? "-"}
            </span>
            <button className={secondaryButton} onClick={() => setExpanded((current) => !current)}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {expanded ? "Collapse" : "Manage"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-[#f7efe6] px-3 py-2 dark:bg-slate-900">
            Teacher: {assignedTeacher?.name || "Unassigned"}
          </span>
          <span className="rounded-full bg-[#f7efe6] px-3 py-2 dark:bg-slate-900">
            Banner: {draft.banner?.slice(0, 18) || "Default"}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 pt-2">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Field label="Title">
                    <Input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Subtitle">
                    <Input
                      value={draft.subtitle}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, subtitle: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Teacher">
                    <Select
                      value={draft.teacherId}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, teacherId: event.target.value }))
                      }
                    >
                      <option value="">Unassigned</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name || teacher.email}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Banner / Accent">
                    <Input
                      value={draft.banner}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, banner: event.target.value }))
                      }
                      placeholder="#0F766E or gradient"
                    />
                  </Field>
                  <Field label="Group Marks">
                    <Input
                      type="number"
                      value={draft.groupMarks}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, groupMarks: event.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButton} onClick={() => onSaveGroup(group._id, draft)}>
                    <Save size={16} />
                    Save Group
                  </button>
                  <button className={dangerButton} onClick={() => onDeleteGroup(group)}>
                    <Trash2 size={16} />
                    Delete Group
                  </button>
                </div>

                <div className="rounded-[20px] border border-[#ece1d6] bg-[#fcf8f1] p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Student Roster
                    </h4>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300">
                    {group.students.length} members
                  </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <Field label="Move Student Into Group">
                      <Select
                        value={selectedRegNo}
                        onChange={(event) => setSelectedRegNo(event.target.value)}
                      >
                        <option value="">Select a student</option>
                        {candidateStudents.map((student) => {
                          const currentGroup = studentGroupLookup[student.regNo];
                          const suffix =
                            currentGroup && currentGroup._id !== group._id
                              ? ` - currently in ${currentGroup.title}`
                              : "";

                          return (
                            <option key={student._id} value={student.regNo}>
                              {student.name || "Unnamed"} ({student.regNo}){suffix}
                            </option>
                          );
                        })}
                      </Select>
                    </Field>
                    <div className="flex items-end">
                      <button
                        className={primaryButton}
                        disabled={!selectedRegNo}
                        onClick={() => onAddStudent(group._id, selectedRegNo)}
                      >
                        <Plus size={16} />
                        Add / Move
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {group.students.length === 0 ? (
                      <EmptyState message="No students in this group yet." />
                    ) : (
                      group.students.map((student) => (
                        <StudentEditorCard
                          key={student._id}
                          student={student}
                          assignedGroupId={group._id}
                          groups={groups}
                          onSave={onSaveStudent}
                          onDelete={onDeleteStudent}
                          onRemoveFromGroup={() => onRemoveStudent(group._id, student)}
                          compact
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AdminPanel({ user, onLogout }) {
  const teacherImportInputRef = useRef(null);
  const studentImportInputRef = useRef(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [activeTeacherId, setActiveTeacherId] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [createPanel, setCreatePanel] = useState("");
  const [adminDraft, setAdminDraft] = useState(makeAdminDraft());
  const [teacherDraft, setTeacherDraft] = useState(makeTeacherDraft());
  const [groupDraft, setGroupDraft] = useState(makeGroupDraft(null));
  const [studentDraft, setStudentDraft] = useState(makeStudentDraft());
  const [confirmDialog, setConfirmDialog] = useState(makeConfirmDialog());
  const [teacherImporting, setTeacherImporting] = useState(false);
  const [studentImporting, setStudentImporting] = useState(false);
  const [exportingWorkbook, setExportingWorkbook] = useState(false);

  async function fetchOverview(preferredTeacherId) {
    const isFirstLoad = !overview;
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await API.get("/admin/overview");
      const nextOverview = response.data;
      setOverview(nextOverview);
      setActiveTeacherId((current) => {
        const nextId = preferredTeacherId || current;
        if (nextId && nextOverview.teachers.some((teacher) => teacher._id === nextId)) {
          return nextId;
        }
        return nextOverview.teachers[0]?._id || "";
      });
    } catch (error) {
      toast.error(extractError(error, "Failed to load admin overview"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    setGroupDraft((current) =>
      current.teacherId
        ? current
        : { ...current, teacherId: activeTeacherId || current.teacherId }
    );
  }, [activeTeacherId]);

  const admins = overview?.admins || [];
  const bootstrapAdminEmails = overview?.bootstrapAdminEmails || [];
  const teachers = overview?.teachers || [];
  const groups = overview?.groups || [];
  const students = overview?.students || [];
  const studentGroupLookup = {};
  groups.forEach((group) => {
    group.studentRegs.forEach((regNo) => {
      studentGroupLookup[regNo] = group;
    });
  });

  const activeTeacher = teachers.find((teacher) => teacher._id === activeTeacherId) || null;
  const filteredAdmins = admins.filter((admin) => {
    const haystack = `${admin.name} ${admin.email}`.toLowerCase();
    return haystack.includes(adminSearch.toLowerCase());
  });
  const filteredTeachers = teachers.filter((teacher) => {
    const haystack = `${teacher.name} ${teacher.email} ${teacher.teacherId}`.toLowerCase();
    return haystack.includes(teacherSearch.toLowerCase());
  });
  const filteredStudents = students.filter((student) => {
    const group = studentGroupLookup[student.regNo];
    const haystack = [
      student.name,
      student.email,
      student.regNo,
      student.otherDetails?.branch,
      student.otherDetails?.year,
      group?.title,
      group?.teacher?.name,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(studentSearch.toLowerCase());
  });
  const filteredGroups = groups
    .filter((group) => {
      const haystack = [
        group.title,
        group.subtitle,
        group.teacher?.name,
        group.teacher?.email,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(groupSearch.toLowerCase());
    })
    .sort((left, right) => {
      if (Boolean(left.teacherId) === Boolean(right.teacherId)) {
        return (left.title || "").localeCompare(right.title || "");
      }

      return left.teacherId ? 1 : -1;
    });

  async function handleCreateAdmin() {
    try {
      const response = await API.post("/admin/admins", adminDraft);
      toast.success("Admin created");
      setAdminDraft(makeAdminDraft());
      setCreatePanel("");
      await fetchOverview(activeTeacherId);
      if (response.data.admin?._id) {
        setActiveView("admins");
      }
    } catch (error) {
      toast.error(extractError(error, "Failed to create admin"));
    }
  }

  async function handleUpdateAdmin(id, payload) {
    try {
      await API.put(`/admin/admins/${id}`, payload);
      toast.success("Admin updated");
      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(extractError(error, "Failed to update admin"));
    }
  }

  function handleDeleteAdmin(admin) {
    openConfirmDialog({
      title: "Delete Admin",
      description: `Delete ${admin.email}? This removes their database admin access.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await API.delete(`/admin/admins/${admin._id}`);
          toast.success("Admin deleted");
          await fetchOverview(activeTeacherId);
        } catch (error) {
          toast.error(extractError(error, "Failed to delete admin"));
          throw error;
        }
      },
    });
  }

  async function handleCreateTeacher() {
    try {
      const response = await API.post("/admin/teachers", teacherDraft);
      toast.success("Teacher created");
      setTeacherDraft(makeTeacherDraft());
      setCreatePanel("");
      await fetchOverview(response.data.teacher?._id);
    } catch (error) {
      toast.error(extractError(error, "Failed to create teacher"));
    }
  }

  async function handleUpdateTeacher(id, payload) {
    try {
      await API.put(`/admin/teachers/${id}`, payload);
      toast.success("Teacher updated");
      await fetchOverview(id);
    } catch (error) {
      toast.error(extractError(error, "Failed to update teacher"));
    }
  }

  function openConfirmDialog(config) {
    setConfirmDialog({
      open: true,
      title: config.title,
      description: config.description,
      confirmLabel: config.confirmLabel || "Confirm",
      submitting: false,
      tone: config.tone || "danger",
      onConfirm: config.onConfirm,
    });
  }

  function closeConfirmDialog() {
    setConfirmDialog((current) =>
      current.submitting ? current : makeConfirmDialog()
    );
  }

  async function executeConfirmDialog() {
    const action = confirmDialog.onConfirm;
    if (!action) return;

    setConfirmDialog((current) => ({ ...current, submitting: true }));

    try {
      await action();
      setConfirmDialog(makeConfirmDialog());
    } catch (error) {
      console.error(error);
      setConfirmDialog((current) => ({ ...current, submitting: false }));
    }
  }

  function handleDeleteTeacher(teacher) {
    openConfirmDialog({
      title: "Delete Teacher",
      description: `Delete ${teacher.name || teacher.email}? This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await API.delete(`/admin/teachers/${teacher._id}`);
          toast.success("Teacher deleted");
          await fetchOverview();
        } catch (error) {
          toast.error(extractError(error, "Failed to delete teacher"));
          throw error;
        }
      },
    });
  }

  async function handleCreateGroup() {
    try {
      await API.post("/admin/groups", groupDraft);
      toast.success("Group created");
      setGroupDraft(makeGroupDraft(null, activeTeacherId));
      setCreatePanel("");
      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(extractError(error, "Failed to create group"));
    }
  }

  async function handleUpdateGroup(id, payload) {
    try {
      await API.put(`/admin/groups/${id}`, payload);
      toast.success("Group updated");
      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(extractError(error, "Failed to update group"));
    }
  }

  function handleDeleteGroup(group) {
    openConfirmDialog({
      title: "Delete Group",
      description: `Delete ${group.title || "this group"}? This removes the group and its assignments.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await API.delete(`/admin/groups/${group._id}`);
          toast.success("Group deleted");
          await fetchOverview(activeTeacherId);
        } catch (error) {
          toast.error(extractError(error, "Failed to delete group"));
          throw error;
        }
      },
    });
  }

  async function handleAddStudentToGroup(groupId, regNo) {
    try {
      await API.post(`/admin/groups/${groupId}/add-student`, { regNo });
      toast.success("Student moved into group");
      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(extractError(error, "Failed to add student to group"));
    }
  }

  function handleRemoveStudentFromGroup(groupId, student) {
    openConfirmDialog({
      title: "Remove Student",
      description: `Remove ${student.name || student.regNo} from this group? Their profile will stay available.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        try {
          await API.post(`/admin/groups/${groupId}/remove-student`, { regNo: student.regNo });
          toast.success("Student removed from group");
          await fetchOverview(activeTeacherId);
        } catch (error) {
          toast.error(extractError(error, "Failed to remove student from group"));
          throw error;
        }
      },
    });
  }

  async function handleCreateStudent() {
    try {
      await API.post("/admin/students", studentDraft);
      toast.success("Student created");
      setStudentDraft(makeStudentDraft());
      setCreatePanel("");
      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(extractError(error, "Failed to create student"));
    }
  }

  async function handleUpdateStudent(regNo, payload) {
    try {
      await API.put(`/admin/students/${regNo}`, payload);
      toast.success("Student updated");
      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(extractError(error, "Failed to update student"));
    }
  }

  function handleDeleteStudent(student) {
    openConfirmDialog({
      title: "Delete Student",
      description: `Delete ${student.name || student.regNo}? This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await API.delete(`/admin/students/${student.regNo}`);
          toast.success("Student deleted");
          await fetchOverview(activeTeacherId);
        } catch (error) {
          toast.error(extractError(error, "Failed to delete student"));
          throw error;
        }
      },
    });
  }

  function formatImportSummary(entityLabel, payload) {
    const segments = [
      `${payload.processed || 0} processed`,
      `${payload.created || 0} created`,
      `${payload.updated || 0} updated`,
    ];

    if (payload.skipped) {
      segments.push(`${payload.skipped} skipped`);
    }

    return `${entityLabel} import complete: ${segments.join(" • ")}`;
  }

  async function handleImportFile(type, file) {
    if (!file) return;

    const endpoint =
      type === "teachers" ? "/admin/import/teachers" : "/admin/import/students";
    const setLoadingState =
      type === "teachers" ? setTeacherImporting : setStudentImporting;

    const formData = new FormData();
    formData.append("file", file);

    setLoadingState(true);

    try {
      const response = await API.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const summary = formatImportSummary(
        type === "teachers" ? "Teacher" : "Student",
        response.data
      );
      if ((response.data.processed || 0) > 0) {
        toast.success(summary);
      } else {
        toast.error(summary);
      }

      if (response.data.errors?.length) {
        toast.error(response.data.errors[0]);
      }

      await fetchOverview(activeTeacherId);
    } catch (error) {
      toast.error(
        extractError(
          error,
          type === "teachers"
            ? "Failed to import teacher workbook"
            : "Failed to import student workbook"
        )
      );
    } finally {
      setLoadingState(false);
    }
  }

  async function handleTeacherFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await handleImportFile("teachers", file);
  }

  async function handleStudentFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await handleImportFile("students", file);
  }

  async function handleExportWorkbook() {
    setExportingWorkbook(true);

    try {
      const response = await API.get("/admin/export/workbook", {
        responseType: "blob",
      });
      const contentDisposition = response.headers["content-disposition"] || "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const fileName = filenameMatch?.[1] || "projectx-data.xlsx";

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Excel workbook downloaded");
    } catch (error) {
      toast.error(extractError(error, "Failed to export workbook"));
    } finally {
      setExportingWorkbook(false);
    }
  }

  function toggleCreatePanel(panel) {
    setCreatePanel((current) => (current === panel ? "" : panel));
  }

  function renderCreatePanel() {
    if (!createPanel) return null;

    if (createPanel === "admin") {
      return (
        <SectionCard
          eyebrow="Create"
          title="New Admin"
          actions={
            <>
              <button className={secondaryButton} onClick={() => setCreatePanel("")}>
                Close
              </button>
              <button className={primaryButton} onClick={handleCreateAdmin}>
                <Plus size={16} />
                Create Admin
              </button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Name">
              <Input
                value={adminDraft.name}
                onChange={(event) =>
                  setAdminDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Admin name"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={adminDraft.email}
                onChange={(event) =>
                  setAdminDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="admin@example.com"
              />
            </Field>
            <Field label="Status">
              <Select
                value={adminDraft.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setAdminDraft((current) => ({
                    ...current,
                    isActive: event.target.value === "active",
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>
        </SectionCard>
      );
    }

    if (createPanel === "teacher") {
      return (
        <SectionCard
          eyebrow="Create"
          title="New Teacher"
          actions={
            <>
              <button className={secondaryButton} onClick={() => setCreatePanel("")}>
                Close
              </button>
              <button className={primaryButton} onClick={handleCreateTeacher}>
                <Plus size={16} />
                Create Teacher
              </button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Teacher ID">
              <Input
                value={teacherDraft.teacherId}
                onChange={(event) =>
                  setTeacherDraft((current) => ({
                    ...current,
                    teacherId: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Name">
              <Input
                value={teacherDraft.name}
                onChange={(event) =>
                  setTeacherDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={teacherDraft.email}
                onChange={(event) =>
                  setTeacherDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </SectionCard>
      );
    }

    if (createPanel === "group") {
      return (
        <SectionCard
          eyebrow="Create"
          title="New Group"
          actions={
            <>
              <button className={secondaryButton} onClick={() => setCreatePanel("")}>
                Close
              </button>
              <button className={primaryButton} onClick={handleCreateGroup}>
                <Plus size={16} />
                Create Group
              </button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Title">
              <Input
                value={groupDraft.title}
                onChange={(event) =>
                  setGroupDraft((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={groupDraft.subtitle}
                onChange={(event) =>
                  setGroupDraft((current) => ({ ...current, subtitle: event.target.value }))
                }
              />
            </Field>
            <Field label="Teacher">
              <Select
                value={groupDraft.teacherId}
                onChange={(event) =>
                  setGroupDraft((current) => ({ ...current, teacherId: event.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name || teacher.email}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Banner / Accent">
              <Input
                value={groupDraft.banner}
                onChange={(event) =>
                  setGroupDraft((current) => ({ ...current, banner: event.target.value }))
                }
              />
            </Field>
            <Field label="Group Marks">
              <Input
                type="number"
                value={groupDraft.groupMarks}
                onChange={(event) =>
                  setGroupDraft((current) => ({
                    ...current,
                    groupMarks: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </SectionCard>
      );
    }

    return (
      <SectionCard
        eyebrow="Create"
        title="New Student"
        actions={
          <>
            <button className={secondaryButton} onClick={() => setCreatePanel("")}>
              Close
            </button>
            <button className={primaryButton} onClick={handleCreateStudent}>
              <Plus size={16} />
              Create Student
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <Field label="Reg No">
            <Input
              value={studentDraft.regNo}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  regNo: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Name">
            <Input
              value={studentDraft.name}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={studentDraft.email}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Branch">
            <Input
              value={studentDraft.branch}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  branch: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Year">
            <Input
              value={studentDraft.year}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  year: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Marks">
            <Input
              type="number"
              value={studentDraft.marks}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  marks: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Assign Group">
            <Select
              value={studentDraft.groupId}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  groupId: event.target.value,
                }))
              }
            >
              <option value="">Unassigned</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.title} {group.teacher ? `- ${group.teacher.name}` : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </SectionCard>
    );
  }

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      Icon: LayoutDashboard,
      count: overview?.stats?.adminCount || 0,
    },
    {
      id: "admins",
      label: "Admins",
      Icon: ShieldCheck,
      count: overview?.stats?.adminCount || 0,
    },
    {
      id: "teachers",
      label: "Teachers",
      Icon: Users,
      count: overview?.stats?.teacherCount || 0,
    },
    {
      id: "groups",
      label: "Groups",
      Icon: Layers3,
      count: overview?.stats?.groupCount || 0,
    },
    {
      id: "students",
      label: "Students",
      Icon: GraduationCap,
      count: overview?.stats?.studentCount || 0,
    },
    {
      id: "data",
      label: "Data",
      Icon: FileSpreadsheet,
      count: (overview?.stats?.teacherCount || 0) + (overview?.stats?.studentCount || 0),
    },
  ];

  function renderTeacherList() {
    return (
      <SectionCard
        eyebrow="Teachers"
        title="Directory"
        actions={
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={teacherSearch}
              onChange={(event) => setTeacherSearch(event.target.value)}
              placeholder="Search teachers"
              className="w-[250px] pl-11"
            />
          </div>
        }
      >
        <div className="space-y-3">
          {filteredTeachers.length === 0 ? (
            <EmptyState message="No teachers found." />
          ) : (
            filteredTeachers.map((teacher) => (
              <button
                key={teacher._id}
                onClick={() => {
                  setActiveTeacherId(teacher._id);
                  setActiveView("teachers");
                }}
                className={cls(
                  "w-full rounded-[24px] border px-4 py-4 text-left transition-all",
                  teacher._id === activeTeacherId
                    ? "border-[#f0c7d5] bg-[#fff2f6] shadow-[0_20px_40px_-30px_rgba(240,92,135,0.55)] dark:border-slate-700 dark:bg-slate-900"
                    : "border-[#e6dbcf] bg-[#fbf6ef] hover:border-[#f0c7d5] hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900 dark:text-white">
                      {teacher.name || "Unnamed Teacher"}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {teacher.email}
                    </div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300">
                    {teacher.groupCount}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </SectionCard>
    );
  }

  function renderDashboardView() {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={ShieldCheck}
            label="Admins"
            value={overview?.stats?.adminCount || 0}
            accent="linear-gradient(135deg, #f05c87, #fb7185)"
          />
          <StatCard
            icon={Users}
            label="Teachers"
            value={overview?.stats?.teacherCount || 0}
            accent="linear-gradient(135deg, #0f766e, #14b8a6)"
          />
          <StatCard
            icon={Layers3}
            label="Groups"
            value={overview?.stats?.groupCount || 0}
            accent="linear-gradient(135deg, #1d4ed8, #60a5fa)"
          />
          <StatCard
            icon={GraduationCap}
            label="Students"
            value={overview?.stats?.studentCount || 0}
            accent="linear-gradient(135deg, #9333ea, #d8b4fe)"
          />
          <StatCard
            icon={UserCog}
            label="Unassigned"
            value={overview?.stats?.unassignedGroupCount || 0}
            accent="linear-gradient(135deg, #f97316, #fb923c)"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            {renderTeacherList()}

            <SectionCard eyebrow="Queue" title="Unassigned">
              <div className="grid gap-3">
                <div className="rounded-[20px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Groups
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight">
                    {overview?.stats?.unassignedGroupCount || 0}
                  </div>
                </div>
                <div className="rounded-[20px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Students
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight">
                    {overview?.stats?.unassignedStudentCount || 0}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard eyebrow="Groups" title="Recent">
            {groups.length === 0 ? (
              <EmptyState message="No groups yet." />
            ) : (
              <div className="space-y-3">
                {groups.slice(0, 8).map((group) => (
                  <button
                    key={group._id}
                    onClick={() => {
                      setActiveTeacherId(group.teacherId || activeTeacherId);
                      setActiveView("groups");
                    }}
                    className="grid w-full items-center gap-3 rounded-[20px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-4 text-left transition hover:border-[#f0c7d5] hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-950 md:grid-cols-[minmax(0,1fr)_140px_120px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900 dark:text-white">
                        {group.title || "Untitled Group"}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {group.teacher?.name || "Unassigned"}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {group.studentCount} students
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {group.groupMarks ?? "-"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  function renderAdminsView() {
    return (
      <div className="space-y-6">
        <SectionCard
          eyebrow="Admins"
          title="Access Control"
          actions={
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={adminSearch}
                  onChange={(event) => setAdminSearch(event.target.value)}
                  placeholder="Search admins"
                  className="w-[250px] pl-11"
                />
              </div>
              <button className={primaryButton} onClick={() => toggleCreatePanel("admin")}>
                <Plus size={16} />
                New Admin
              </button>
            </div>
          }
        >
          {filteredAdmins.length === 0 ? (
            <EmptyState message="No database admins found yet." />
          ) : (
            <div className="space-y-4">
              {filteredAdmins.map((admin) => (
                <AdminEditorCard
                  key={admin._id}
                  admin={admin}
                  isBootstrap={bootstrapAdminEmails.includes((admin.email || "").toLowerCase())}
                  onSave={handleUpdateAdmin}
                  onDelete={handleDeleteAdmin}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="Recovery" title="Bootstrap Admins">
          {bootstrapAdminEmails.length === 0 ? (
            <EmptyState message="No SUPER_ADMIN_EMAILS recovery addresses are configured." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {bootstrapAdminEmails.map((email) => (
                <span
                  key={email}
                  className="rounded-full border border-[#f0c7d5] bg-[#fff2f6] px-3 py-2 text-xs font-semibold text-[#b43f6b] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  {email}
                </span>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  function renderTeacherView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {renderTeacherList()}

        <div className="space-y-6">
          <TeacherEditor
            teacher={activeTeacher}
            onSave={handleUpdateTeacher}
            onDelete={handleDeleteTeacher}
            onOpenStudents={() => setActiveView("students")}
          />

          <SectionCard
            eyebrow="Groups"
            title={activeTeacher ? activeTeacher.name : "Teacher Groups"}
            actions={
              <button className={secondaryButton} onClick={() => toggleCreatePanel("group")}>
                <Plus size={16} />
                New Group
              </button>
            }
          >
            {activeTeacher?.groups?.length ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {activeTeacher.groups.map((group) => (
                  <GroupEditorCard
                    key={group._id}
                    group={group}
                    teachers={teachers}
                    allStudents={students}
                    studentGroupLookup={studentGroupLookup}
                    groups={groups}
                    onSaveGroup={handleUpdateGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onAddStudent={handleAddStudentToGroup}
                    onRemoveStudent={handleRemoveStudentFromGroup}
                    onSaveStudent={handleUpdateStudent}
                    onDeleteStudent={handleDeleteStudent}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                message={activeTeacher ? "This teacher has no groups yet." : "Select a teacher."}
              />
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  function renderGroupsView() {
    return (
      <SectionCard
        eyebrow="Groups"
        title="All Groups"
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="Search groups"
                className="w-[250px] pl-11"
              />
            </div>
            <button className={primaryButton} onClick={() => toggleCreatePanel("group")}>
              <Plus size={16} />
              New Group
            </button>
          </div>
        }
      >
        {filteredGroups.length === 0 ? (
          <EmptyState message="No groups found." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredGroups.map((group) => (
              <GroupEditorCard
                key={group._id}
                group={group}
                teachers={teachers}
                allStudents={students}
                studentGroupLookup={studentGroupLookup}
                groups={groups}
                onSaveGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
                onAddStudent={handleAddStudentToGroup}
                onRemoveStudent={handleRemoveStudentFromGroup}
                onSaveStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            ))}
          </div>
        )}
      </SectionCard>
    );
  }

  function renderStudentView() {
    return (
      <SectionCard
        eyebrow="Students"
        title="Directory"
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search students"
                className="w-[250px] pl-11"
              />
            </div>
            <button className={primaryButton} onClick={() => toggleCreatePanel("student")}>
              <Plus size={16} />
              New Student
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <EmptyState message="No students found." />
          ) : (
            filteredStudents.map((student) => (
              <StudentEditorCard
                key={student._id}
                student={student}
                assignedGroupId={studentGroupLookup[student.regNo]?._id || ""}
                groups={groups}
                onSave={handleUpdateStudent}
                onDelete={handleDeleteStudent}
                showGroupSelect
                compact
              />
            ))
          )}
        </div>
      </SectionCard>
    );
  }

  function renderDataView() {
    return (
      <div className="space-y-6">
        <SectionCard eyebrow="Excel" title="Import & Export">
          <div className="grid gap-6 xl:grid-cols-3">
            <DataToolCard
              icon={Upload}
              label="Import"
              title="Teachers Workbook"
              description="Upload a `.xlsx` file to create or update teachers by email."
            >
              <div className="flex flex-wrap gap-2">
                {["teacherId", "name", "email"].map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300"
                  >
                    {field}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => teacherImportInputRef.current?.click()}
                  disabled={teacherImporting}
                >
                  <Upload size={16} />
                  {teacherImporting ? "Importing..." : "Upload Teachers"}
                </button>
              </div>
            </DataToolCard>

            <DataToolCard
              icon={Upload}
              label="Import"
              title="Students Workbook"
              description="Upload a `.xlsx` file to create or update students by regNo."
            >
              <div className="flex flex-wrap gap-2">
                {[
                  "regNo",
                  "name",
                  "email",
                  "branch",
                  "year",
                  "marks",
                  "groupId",
                ].map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["groupTitle", "groupTeacherEmail"].map((field) => (
                  <span
                    key={field}
                    className="rounded-full border border-[#f0c7d5] bg-[#fff2f6] px-3 py-1.5 text-xs font-medium text-[#b43f6b] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    {field}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => studentImportInputRef.current?.click()}
                  disabled={studentImporting}
                >
                  <Upload size={16} />
                  {studentImporting ? "Importing..." : "Upload Students"}
                </button>
              </div>
            </DataToolCard>

            <DataToolCard
              icon={Download}
              label="Export"
              title="Current Workbook"
              description="Download admins, teachers, groups, and students in one Excel file."
            >
              <div className="flex flex-wrap gap-2">
                {["Admins", "Teachers", "Groups", "Students"].map((sheet) => (
                  <span
                    key={sheet}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8b7e73] shadow-sm dark:bg-slate-950 dark:text-slate-300"
                  >
                    {sheet}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={handleExportWorkbook}
                  disabled={exportingWorkbook}
                >
                  <Download size={16} />
                  {exportingWorkbook ? "Preparing..." : "Download Excel"}
                </button>
              </div>
            </DataToolCard>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Flow" title="Best Results">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                1. Download
              </div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Export the workbook to get the exact columns the app understands.
              </div>
            </div>
            <div className="rounded-[20px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                2. Edit
              </div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Update the Excel rows in place or add new ones for bulk insert.
              </div>
            </div>
            <div className="rounded-[20px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                3. Upload
              </div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Re-upload teachers or students and the panel will refresh automatically.
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-[#f4f1e8] px-6 py-8 dark:bg-[#09090f]">
        <div className="mx-auto mb-8 max-w-[1800px] rounded-[30px] border border-white/60 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <div className="h-8 w-72 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mx-auto max-w-[1800px]">
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  const viewMeta = {
    dashboard: { title: "Dashboard" },
    admins: { title: "Admins" },
    teachers: { title: "Teachers" },
    groups: { title: "Groups" },
    students: { title: "Students" },
    data: { title: "Data" },
  }[activeView];

  function renderNavButton(item, mobile = false) {
    const active = item.id === activeView;
    const Icon = item.Icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveView(item.id)}
        className={cls(
          "transition-all",
          mobile
            ? cls(
                "inline-flex items-center gap-2 rounded-[16px] border px-4 py-3 text-sm font-semibold whitespace-nowrap",
                active
                  ? "border-[#f0c7d5] bg-[#fff2f6] text-[#b43f6b] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  : "border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              )
            : cls(
                "relative flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left",
                active
                  ? "border-white/6 bg-[rgba(240,92,135,0.16)] text-white"
                  : "border-transparent text-[#c3bdd8] hover:border-white/6 hover:bg-white/6 hover:text-white"
              )
        )}
      >
        {mobile || !active ? null : (
          <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#f05c87]" />
        )}
        <span
          className={cls(
            "flex h-9 w-9 items-center justify-center rounded-2xl",
            mobile
              ? ""
              : active
                ? "bg-white/10 text-white"
                : "bg-white/6 text-[#c3bdd8]"
          )}
        >
          <Icon size={18} />
        </span>
        <span className={mobile ? "hidden" : "hidden min-w-0 flex-1 xl:block"}>
          <span className="block truncate text-sm font-semibold">{item.label}</span>
        </span>
        {mobile ? null : (
          <span className="hidden rounded-full bg-white/8 px-2.5 py-1 text-xs text-[#c3bdd8] xl:block">
            {item.count}
          </span>
        )}
        {mobile ? item.label : null}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1e8] text-slate-900 dark:bg-[#09090f] dark:text-white">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(232,221,209,0.9)] bg-[rgba(255,251,246,0.92)] backdrop-blur-xl dark:border-slate-800 dark:bg-[rgba(11,10,18,0.9)] lg:left-[108px] xl:left-[280px]">
        <div className="mx-auto flex h-[82px] max-w-[1680px] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#f05c87] text-white shadow-[0_20px_40px_-24px_rgba(240,92,135,0.75)]">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
                Admin Panel
              </div>
              <div className="truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {viewMeta.title}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className={secondaryButton} onClick={() => toggleCreatePanel("admin")}>
              <ShieldCheck size={16} />
              <span className="hidden sm:inline">Admin</span>
            </button>
            <button className={secondaryButton} onClick={() => toggleCreatePanel("teacher")}>
              <UserCog size={16} />
              <span className="hidden sm:inline">Teacher</span>
            </button>
            <button className={secondaryButton} onClick={() => toggleCreatePanel("group")}>
              <Layers3 size={16} />
              <span className="hidden sm:inline">Group</span>
            </button>
            <button className={secondaryButton} onClick={() => toggleCreatePanel("student")}>
              <GraduationCap size={16} />
              <span className="hidden sm:inline">Student</span>
            </button>
            <button
              className={primaryButton}
              onClick={() => fetchOverview(activeTeacherId)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <DarkModeToggle />
            <ProfileDropdown user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[108px] overflow-hidden border-r border-white/6 bg-[#181629] text-white lg:block xl:w-[280px]">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,_rgba(240,92,135,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(53,199,243,0.12),_transparent_36%)]" />

          <div className="relative flex h-full flex-col px-4 py-6 xl:px-5">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 xl:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f05c87] text-sm font-black text-white shadow-[0_18px_40px_-24px_rgba(240,92,135,0.75)]">
                  AX
                </div>
                <div className="hidden xl:block">
                  <div className="text-sm font-bold tracking-tight text-white">
                    ProjectX
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8d86a7]">
                    Control
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="hidden px-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#716a8d] xl:block">
                Navigation
              </div>
              <div className="mt-3 space-y-2">
                {navigationItems.map((item) => renderNavButton(item))}
              </div>
            </div>

            <div className="mt-auto rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 xl:p-5">
              <div className="hidden text-[10px] font-semibold uppercase tracking-[0.34em] text-[#716a8d] xl:block">
                Active Teacher
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-white xl:mt-3">
                {activeTeacher?.name || "No selection"}
              </div>
              <div className="mt-1 truncate text-xs text-[#948cae]">
                {activeTeacher?.email || user.email}
              </div>
              <div className="mt-4 hidden rounded-[18px] border border-white/8 bg-[#121021] px-3 py-3 xl:block">
                <div className="text-[10px] uppercase tracking-[0.28em] text-[#716a8d]">
                  Groups
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {activeTeacher?.groupCount || 0}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 pb-10 pt-[98px] lg:ml-[108px] lg:px-6 xl:ml-[280px]">
          <div className="mx-auto max-w-[1560px] space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigationItems.map((item) => renderNavButton(item, true))}
            </div>

            <SectionCard eyebrow="Workspace" title={viewMeta.title}>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-[#f7efe6] px-3 py-2 dark:bg-slate-900">
                  {user.email}
                </span>
                {activeTeacher ? (
                  <span className="rounded-full border border-[#f0c7d5] bg-[#fff2f6] px-3 py-2 text-[#b43f6b] dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    {activeTeacher.name}
                  </span>
                ) : null}
              </div>
            </SectionCard>

            <AnimatePresence mode="wait">
              {createPanel ? (
                <motion.div
                  key={createPanel}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {renderCreatePanel()}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {activeView === "dashboard" ? renderDashboardView() : null}
            {activeView === "admins" ? renderAdminsView() : null}
            {activeView === "teachers" ? renderTeacherView() : null}
            {activeView === "groups" ? renderGroupsView() : null}
            {activeView === "students" ? renderStudentView() : null}
            {activeView === "data" ? renderDataView() : null}
          </div>
        </main>
      </div>

      <input
        ref={teacherImportInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleTeacherFileChange}
      />
      <input
        ref={studentImportInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleStudentFileChange}
      />

      <AppDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onClose={confirmDialog.submitting ? undefined : closeConfirmDialog}
        actions={
          <>
            <button
              type="button"
              onClick={closeConfirmDialog}
              disabled={confirmDialog.submitting}
              className={secondaryButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeConfirmDialog}
              disabled={confirmDialog.submitting}
              className={confirmDialog.tone === "danger" ? dangerButton : primaryButton}
            >
              {confirmDialog.submitting ? "Working..." : confirmDialog.confirmLabel}
            </button>
          </>
        }
      >
        <div className="rounded-[18px] border border-[#efe2d5] bg-[#fbf6ef] px-4 py-4 text-sm text-[#8b7e73] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Please confirm this action.
        </div>
      </AppDialog>
    </div>
  );
}
