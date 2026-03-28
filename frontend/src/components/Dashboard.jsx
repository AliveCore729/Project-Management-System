import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  Home,
  Layers3,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

import API from "../api";
import AppDialog from "./AppDialog";
import GroupCard from "./GroupCard";
import GroupModal from "./GroupModal";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import SkeletonGrid from "./SkeletonGrid";

function getProgressValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
}

function StatCard({ label, value, note, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[22px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] shadow-[0_22px_50px_-36px_rgba(35,26,16,0.25)] dark:border-slate-800 dark:bg-slate-950/92"
    >
      <div className="h-[3px] w-full" style={{ background: accent }} />
      <div className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#a29386] dark:text-slate-500">
          {label}
        </div>
        <div className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {note ? (
          <div className="mt-3 inline-flex items-center rounded-full bg-[#f7efe6] px-2.5 py-1 text-[11px] font-semibold text-[#8d7f73] dark:bg-slate-900 dark:text-slate-400">
            {note}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] p-5 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] dark:border-slate-800 dark:bg-slate-950/92">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, note }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#dfd2c3] px-5 py-10 text-center dark:border-slate-700">
      <div className="text-base font-semibold text-slate-900 dark:text-white">{title}</div>
      {note ? (
        <div className="mt-2 text-sm text-[#8b7e73] dark:text-slate-400">{note}</div>
      ) : null}
    </div>
  );
}

function MobileViewTabs({ items, activeView, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {items.map((item) => {
        const Icon = item.Icon;
        const active = activeView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-[16px] border px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
              active
                ? "border-[#f0c7d5] bg-[#fff2f6] text-[#b43f6b] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                : "border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            }`}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function GroupRow({ group, onOpen }) {
  const progress = getProgressValue(group.groupMarks);
  const status =
    group.groupMarks === null
      ? { label: "Pending", className: "bg-[#fff3df] text-[#ca8a04]" }
      : progress >= 75
        ? { label: "On Track", className: "bg-[#e7f9ef] text-[#0f9f62]" }
        : { label: "Review", className: "bg-[#fff1f4] text-[#d9485f]" };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full items-center gap-4 rounded-[18px] border border-transparent px-3 py-3 text-left transition hover:border-[#eadfd2] hover:bg-[#fcf8f1] dark:hover:border-slate-800 dark:hover:bg-slate-900"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_120px] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f05c87]" />
            <div className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
              {group.title}
            </div>
          </div>
          <div className="mt-1 text-sm text-[#8b7e73] dark:text-slate-400">
            {(group.studentRegs?.length || 0)} students
            {group.subtitle ? `  |  ${group.subtitle}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eee2d6] dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f05c87] via-[#35c7f3] to-[#f3b14b]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="w-10 text-right text-xs font-semibold text-[#8b7e73] dark:text-slate-400">
            {group.groupMarks ?? "-"}%
          </div>
        </div>

        <div className="flex justify-start lg:justify-end">
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function StudentRow({ student, onOpenGroup }) {
  return (
    <div className="grid gap-3 rounded-[18px] border border-[#ece1d6] bg-[#fcf8f1] px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_110px_150px_90px_120px] lg:items-center">
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
          {student.name || "Unnamed Student"}
        </div>
        <div className="mt-1 truncate text-sm text-[#8b7e73] dark:text-slate-400">
          {student.email || student.regNo}
        </div>
      </div>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{student.regNo}</div>
      <div className="text-sm text-[#8b7e73] dark:text-slate-400">
        {student.groupTitle || "Unassigned"}
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        {student.marks ?? 0}
      </div>
      <div className="flex justify-start lg:justify-end">
        {student.groupId ? (
          <button
            type="button"
            onClick={() => onOpenGroup(student.groupId)}
            className="rounded-[14px] border border-[#e3d7ca] bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
          >
            Open
          </button>
        ) : (
          <span className="rounded-full bg-[#efe4d7] px-3 py-1.5 text-xs font-semibold text-[#8b7e73] dark:bg-slate-800 dark:text-slate-300">
            No Group
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ teacher, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [createDialog, setCreateDialog] = useState({
    open: false,
    title: "",
    subtitle: "",
    saving: false,
  });

  const viewItems = [
    { id: "dashboard", label: "Dashboard", Icon: Home, note: "Overview", section: "Overview" },
    { id: "groups", label: "Groups", Icon: Layers3, note: "Manage groups", section: "Workspace" },
    {
      id: "students",
      label: "Students",
      Icon: GraduationCap,
      note: "Browse roster",
      section: "Workspace",
    },
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeView !== "students") return;
    fetchStudents();
  }, [activeView, groups]);

  async function fetchGroups() {
    setLoading(true);

    try {
      const response = await API.get("/groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    if (groups.length === 0) {
      setStudents([]);
      return;
    }

    setStudentsLoading(true);

    try {
      const responses = await Promise.all(groups.map((group) => API.get(`/groups/${group._id}`)));

      const nextStudents = responses.flatMap((response, index) => {
        const group = response.data.group || groups[index];
        const groupStudents = response.data.students || [];

        return groupStudents.map((student) => ({
          ...student,
          groupId: group?._id || groups[index]?._id || "",
          groupTitle: group?.title || groups[index]?.title || "",
        }));
      });

      const byRegNo = new Map();
      nextStudents.forEach((student) => {
        if (!student?.regNo) return;
        byRegNo.set(student.regNo, student);
      });

      setStudents(Array.from(byRegNo.values()));
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setStudentsLoading(false);
    }
  }

  function openCreateGroupDialog() {
    setCreateDialog({
      open: true,
      title: "",
      subtitle: "",
      saving: false,
    });
  }

  function closeCreateGroupDialog() {
    setCreateDialog((current) => ({ ...current, open: false }));
  }

  async function createGroup() {
    const title = createDialog.title.trim();
    const subtitle = createDialog.subtitle.trim();

    if (!title) {
      toast.error("Enter a group title");
      return;
    }

    setCreateDialog((current) => ({ ...current, saving: true }));

    try {
      const banner = "linear-gradient(135deg, #f05c87, #35c7f3, #f3b14b)";
      const response = await API.post("/groups", { title, subtitle, banner });
      setGroups((current) => [response.data, ...current]);
      setActiveView("groups");
      setCreateDialog({
        open: false,
        title: "",
        subtitle: "",
        saving: false,
      });
      toast.success("Group created");
    } catch (error) {
      setCreateDialog((current) => ({ ...current, saving: false }));
      toast.error(error?.response?.data?.error || "Cannot create group");
    }
  }

  function openGroupById(groupId) {
    const nextGroup = groups.find((group) => group._id === groupId);
    if (nextGroup) {
      setActive(nextGroup);
    }
  }

  const totalStudents = groups.reduce(
    (count, group) => count + (group.studentRegs?.length || 0),
    0
  );
  const gradedGroups = groups.filter((group) => group.groupMarks !== null).length;
  const pendingGroups = groups.filter((group) => group.groupMarks === null).length;
  const flaggedGroups = groups.filter(
    (group) => !group.studentRegs?.length || group.groupMarks === null
  );
  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      [
        student.name,
        student.email,
        student.regNo,
        student.groupTitle,
        student.otherDetails?.branch,
        student.otherDetails?.year,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [studentQuery, students]);

  const viewMeta = {
    dashboard: { label: "Dashboard", title: "Overview" },
    groups: { label: "Groups", title: "Groups" },
    students: { label: "Students", title: "Students" },
  }[activeView];

  function renderDashboardView() {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Active Groups"
            value={groups.length}
            note="Current"
            accent="linear-gradient(90deg, #f05c87, #ff8cab)"
          />
          <StatCard
            label="Students Managed"
            value={totalStudents}
            note="Total"
            accent="linear-gradient(90deg, #35c7f3, #66d9ff)"
          />
          <StatCard
            label="Marks Pending"
            value={pendingGroups}
            note={`${gradedGroups} graded`}
            accent="linear-gradient(90deg, #f3b14b, #f7ca79)"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Panel
            title="Active Groups"
            action={
              <button
                type="button"
                onClick={() => setActiveView("groups")}
                className="text-sm font-semibold text-[#b43f6b] transition hover:text-[#953459] dark:text-slate-300 dark:hover:text-white"
              >
                View all
              </button>
            }
          >
            {loading ? (
              <SkeletonGrid count={3} />
            ) : groups.length === 0 ? (
              <EmptyState title="No groups yet" note="Create your first group to get started." />
            ) : (
              <div className="space-y-1">
                {groups.slice(0, 6).map((group) => (
                  <GroupRow key={group._id} group={group} onOpen={() => setActive(group)} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Attention">
            {flaggedGroups.length === 0 ? (
              <EmptyState title="Everything looks good" />
            ) : (
              <div className="space-y-3">
                {flaggedGroups.slice(0, 5).map((group) => (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => setActive(group)}
                    className="w-full rounded-[18px] border border-[#ece1d6] bg-[#fcf8f1] px-4 py-4 text-left transition hover:border-[#ead2dd] hover:bg-[#fff8fb] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-950"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {group.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!group.studentRegs?.length ? (
                        <span className="rounded-full bg-[#fff1f4] px-3 py-1.5 text-xs font-semibold text-[#d9485f]">
                          No students
                        </span>
                      ) : null}
                      {group.groupMarks === null ? (
                        <span className="rounded-full bg-[#fff3df] px-3 py-1.5 text-xs font-semibold text-[#ca8a04]">
                          Marks pending
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  function renderGroupsView() {
    if (loading) {
      return <SkeletonGrid count={6} />;
    }

    if (groups.length === 0) {
      return <EmptyState title="No groups yet" note="Create a new group to start organizing students." />;
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        <motion.button
          type="button"
          onClick={openCreateGroupDialog}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-[#e2c9d4] bg-[rgba(255,252,247,0.96)] px-6 text-center shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] transition hover:border-[#f0c7d5] hover:bg-[#fff6fa] dark:border-slate-800 dark:bg-slate-950/92 dark:hover:bg-slate-900"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#fff0f5] text-[#b43f6b] dark:bg-slate-900 dark:text-white">
            <Plus size={30} />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Create Group</div>
        </motion.button>

        <AnimatePresence>
          {groups.map((group) => (
            <motion.div
              key={group._id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <GroupCard group={group} onOpen={() => setActive(group)} onRefresh={fetchGroups} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  function renderStudentsView() {
    return (
      <Panel
        title="Students"
        action={
          <input
            value={studentQuery}
            onChange={(event) => setStudentQuery(event.target.value)}
            placeholder="Search students"
            className="w-full rounded-[16px] border border-[#e6dbcf] bg-[#fbf6ef] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:bg-white focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:bg-slate-950 dark:focus:ring-slate-800 md:w-[260px]"
          />
        }
      >
        {studentsLoading ? (
          <SkeletonGrid count={4} />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title={groups.length === 0 ? "No students yet" : "No students match your search"}
            note={groups.length === 0 ? "Add students inside a group to see them here." : ""}
          />
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <StudentRow key={student.regNo} student={student} onOpenGroup={openGroupById} />
            ))}
          </div>
        )}
      </Panel>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Navbar
        teacher={teacher}
        onCreate={openCreateGroupDialog}
        onSelectGroup={(group) => setActive(group)}
        onLogout={onLogout}
        viewLabel={viewMeta.label}
      />

      <div className="flex">
        <Sidebar
          items={viewItems}
          activeView={activeView}
          onChange={setActiveView}
          teacher={teacher}
        />

        <main className="flex-1 px-4 pb-10 pt-[98px] lg:ml-[108px] lg:px-6 xl:ml-[280px]">
          <div className="mx-auto max-w-[1560px] space-y-6">
            <MobileViewTabs items={viewItems} activeView={activeView} onChange={setActiveView} />

            <section className="rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] px-5 py-5 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] dark:border-slate-800 dark:bg-slate-950/92">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
                    Teacher Workspace
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {viewMeta.title}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-semibold text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
                    {teacher.email}
                  </span>
                  <span className="rounded-full bg-[#f7efe6] px-3 py-2 text-xs font-semibold text-[#8b7e73] dark:bg-slate-900 dark:text-slate-300">
                    ID: {teacher.teacherId || "-"}
                  </span>
                  <button
                    type="button"
                    onClick={openCreateGroupDialog}
                    className="inline-flex items-center gap-2 rounded-[16px] bg-[#f05c87] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(240,92,135,0.75)] transition hover:bg-[#d84f77]"
                  >
                    <Plus size={16} />
                    Create Group
                  </button>
                </div>
              </div>
            </section>

            {activeView === "dashboard" ? renderDashboardView() : null}
            {activeView === "groups" ? renderGroupsView() : null}
            {activeView === "students" ? renderStudentsView() : null}
          </div>
        </main>
      </div>

      {active ? (
        <GroupModal
          group={active}
          onClose={() => {
            setActive(null);
            fetchGroups();
            if (activeView === "students") {
              fetchStudents();
            }
          }}
        />
      ) : null}

      <AppDialog
        open={createDialog.open}
        title="Create Group"
        description="Add the new group details."
        onClose={createDialog.saving ? undefined : closeCreateGroupDialog}
        actions={
          <>
            <button
              type="button"
              onClick={closeCreateGroupDialog}
              disabled={createDialog.saving}
              className="inline-flex items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createGroup}
              disabled={createDialog.saving}
              className="inline-flex items-center justify-center rounded-[16px] bg-[#f05c87] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d84f77] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createDialog.saving ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7e73] dark:text-slate-400">
              Group Title
            </span>
            <input
              value={createDialog.title}
              onChange={(event) =>
                setCreateDialog((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="AI Lab Team"
              className="w-full rounded-[16px] border border-[#e6dbcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7e73] dark:text-slate-400">
              Subtitle
            </span>
            <input
              value={createDialog.subtitle}
              onChange={(event) =>
                setCreateDialog((current) => ({ ...current, subtitle: event.target.value }))
              }
              placeholder="Final year project group"
              className="w-full rounded-[16px] border border-[#e6dbcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-[#b09f91] focus:border-[#f0c7d5] focus:ring-4 focus:ring-[#f8dce5] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
            />
          </label>
        </div>
      </AppDialog>
    </div>
  );
}
