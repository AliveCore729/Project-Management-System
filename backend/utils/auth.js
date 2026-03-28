const Teacher = require("../models/Teacher");

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAdminEmails() {
  return [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeEmail)
    .filter(Boolean);
}

function isAdminEmail(email) {
  const normalized = normalizeEmail(email);
  return getAdminEmails().includes(normalized);
}

function serializeTeacher(teacher) {
  if (!teacher) return null;

  return {
    _id: teacher._id.toString(),
    teacherId: teacher.teacherId || "",
    name: teacher.name || "",
    email: teacher.email || "",
  };
}

async function findTeacherByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return Teacher.findOne({
    email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i"),
  });
}

async function resolveAuthenticatedUser({ email, name }) {
  const normalizedEmail = normalizeEmail(email);
  const teacherDoc = await findTeacherByEmail(normalizedEmail);
  const role = isAdminEmail(normalizedEmail)
    ? "admin"
    : teacherDoc
      ? "teacher"
      : null;

  if (!role) return null;

  return {
    id: teacherDoc?._id?.toString() || normalizedEmail,
    role,
    email: normalizedEmail,
    name: teacherDoc?.name || name || "Admin",
    teacherId: teacherDoc?.teacherId || "",
    teacherObjectId: teacherDoc?._id?.toString() || null,
    teacher: serializeTeacher(teacherDoc),
    teacherDoc,
  };
}

module.exports = {
  findTeacherByEmail,
  getAdminEmails,
  isAdminEmail,
  normalizeEmail,
  resolveAuthenticatedUser,
  serializeTeacher,
};
