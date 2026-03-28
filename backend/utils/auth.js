const Admin = require("../models/Admin");
const Teacher = require("../models/Teacher");

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBootstrapAdminEmails() {
  return [
    process.env.SUPER_ADMIN_EMAIL,
    process.env.SUPER_ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeEmail)
    .filter(Boolean);
}

function isBootstrapAdminEmail(email) {
  const normalized = normalizeEmail(email);
  return getBootstrapAdminEmails().includes(normalized);
}

function useSecureCookies() {
  return process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
}

function getSessionCookieBaseOptions() {
  const secure = useSecureCookies();

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
}

function getSessionCookieOptions(maxAge) {
  return {
    ...getSessionCookieBaseOptions(),
    maxAge,
  };
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

function serializeAdmin(admin) {
  if (!admin) return null;

  return {
    _id: admin._id.toString(),
    email: admin.email || "",
    name: admin.name || "",
    isActive: Boolean(admin.isActive),
    createdByEmail: admin.createdByEmail || "",
    createdAt: admin.createdAt || null,
    updatedAt: admin.updatedAt || null,
  };
}

async function findAdminByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return Admin.findOne({
    email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i"),
  });
}

async function findActiveAdminByEmail(email) {
  const admin = await findAdminByEmail(email);
  if (!admin?.isActive) return null;
  return admin;
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
  const [adminDoc, teacherDoc] = await Promise.all([
    findActiveAdminByEmail(normalizedEmail),
    findTeacherByEmail(normalizedEmail),
  ]);
  const isBootstrapAdmin = isBootstrapAdminEmail(normalizedEmail);
  const role = adminDoc || isBootstrapAdmin ? "admin" : teacherDoc ? "teacher" : null;

  if (!role) return null;

  return {
    id: adminDoc?._id?.toString() || teacherDoc?._id?.toString() || normalizedEmail,
    role,
    email: normalizedEmail,
    name: adminDoc?.name || teacherDoc?.name || name || "Admin",
    teacherId: teacherDoc?.teacherId || "",
    adminId: adminDoc?._id?.toString() || null,
    admin: serializeAdmin(adminDoc),
    isBootstrapAdmin,
    teacherObjectId: teacherDoc?._id?.toString() || null,
    teacher: serializeTeacher(teacherDoc),
    adminDoc,
    teacherDoc,
  };
}

module.exports = {
  findActiveAdminByEmail,
  findAdminByEmail,
  findTeacherByEmail,
  getBootstrapAdminEmails,
  isBootstrapAdminEmail,
  getSessionCookieBaseOptions,
  getSessionCookieOptions,
  normalizeEmail,
  resolveAuthenticatedUser,
  serializeAdmin,
  serializeTeacher,
};
