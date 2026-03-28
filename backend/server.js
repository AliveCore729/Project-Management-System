const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const ExcelJS = require("exceljs");
const jwt = require("jsonwebtoken");

const Admin = require("./models/Admin");
const Teacher = require("./models/Teacher");
const Student = require("./models/Student");
const Group = require("./models/Group");
const { googleSignIn } = require("./controllers/authController");
const {
  findActiveAdminByEmail,
  findTeacherByEmail,
  getBootstrapAdminEmails,
  getSessionCookieBaseOptions,
  normalizeEmail,
  resolveAuthenticatedUser,
  serializeAdmin,
  serializeTeacher,
} = require("./utils/auth");

dotenv.config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

function serializeSessionUser(user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    adminId: user.adminId || "",
    admin: user.admin || null,
    isBootstrapAdmin: Boolean(user.isBootstrapAdmin),
    teacherId: user.teacherId || "",
    teacher: user.teacher,
  };
}

function serializeStudent(student) {
  const otherDetails =
    student?.otherDetails && typeof student.otherDetails === "object"
      ? student.otherDetails
      : {};

  return {
    _id: student._id.toString(),
    regNo: student.regNo || "",
    name: student.name || "",
    email: student.email || "",
    otherDetails: {
      branch: otherDetails.branch || "",
      year: otherDetails.year || "",
    },
    marks: typeof student.marks === "number" ? student.marks : 0,
  };
}

function serializeGroup(group, options = {}) {
  return {
    _id: group._id.toString(),
    title: group.title || "",
    subtitle: group.subtitle || "",
    banner: group.banner || "#60A5FA",
    teacherId: group.teacherId ? group.teacherId.toString() : null,
    studentRegs: Array.isArray(group.studentRegs) ? group.studentRegs : [],
    studentCount: Array.isArray(group.studentRegs) ? group.studentRegs.length : 0,
    groupMarks: group.groupMarks ?? null,
    groupMarksUpdatedAt: group.groupMarksUpdatedAt || null,
    teacher: options.teacher || null,
    students: options.students || [],
  };
}

function parseNullableNumber(value, fieldName) {
  if (value === undefined) {
    return { ok: true, hasValue: false, value: undefined };
  }

  if (value === "" || value === null) {
    return { ok: true, hasValue: true, value: null };
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return { ok: false, error: `${fieldName} must be a number.` };
  }

  return { ok: true, hasValue: true, value: parsed };
}

function getExcelCellText(value) {
  if (value === undefined || value === null) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || "").join("").trim();
    }

    if (value.text !== undefined) {
      return String(value.text || "").trim();
    }

    if (value.result !== undefined) {
      return getExcelCellText(value.result);
    }

    if (value.hyperlink !== undefined) {
      return String(value.hyperlink || "").trim();
    }
  }

  return String(value).trim();
}

function normalizeHeaderName(value) {
  return getExcelCellText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildWorksheetHeaderMap(sheet) {
  const headerMap = new Map();
  const headerRow = sheet.getRow(1);

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const key = normalizeHeaderName(cell.value);
    if (key) {
      headerMap.set(key, columnNumber);
    }
  });

  return headerMap;
}

function getWorksheetValue(row, headerMap, aliases) {
  for (const alias of aliases) {
    const columnNumber = headerMap.get(normalizeHeaderName(alias));
    if (columnNumber) {
      return getExcelCellText(row.getCell(columnNumber).value);
    }
  }

  return "";
}

function hasWorksheetHeader(headerMap, aliases) {
  return aliases.some((alias) => headerMap.has(normalizeHeaderName(alias)));
}

async function loadWorkbookFromUpload(file) {
  if (!file?.buffer) {
    throw new Error("Excel file is required");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  return workbook;
}

function getWorkbookSheet(workbook, preferredNames) {
  for (const name of preferredNames) {
    const sheet = workbook.getWorksheet(name);
    if (sheet) {
      return sheet;
    }
  }

  return workbook.worksheets[0] || null;
}

function styleSheetHeader(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  headerRow.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function setExcelDownloadHeaders(res, filename) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

async function authMiddleware(req, res, next) {
  const token =
    req.cookies.session ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const authUser = await resolveAuthenticatedUser({
      email: payload.email,
      name: payload.name,
    });

    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized session" });
    }

    req.user = serializeSessionUser(authUser);
    req.teacherDoc = authUser.teacherDoc || null;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

function requireTeacher(req, res, next) {
  if (req.user?.role !== "teacher") {
    return res.status(403).json({ error: "Teacher access required" });
  }

  next();
}

async function getManagedGroup(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return null;
  }

  if (req.user.role === "admin") {
    return group;
  }

  if (!req.user.teacher?._id) {
    res.status(403).json({ error: "Teacher account missing" });
    return null;
  }

  if (group.teacherId?.toString() !== req.user.teacher._id) {
    res.status(403).json({ error: "You cannot manage this group" });
    return null;
  }

  return group;
}

async function removeStudentFromAllGroups(regNo) {
  const groups = await Group.find({ studentRegs: regNo });

  for (const group of groups) {
    group.studentRegs = group.studentRegs.filter((currentRegNo) => currentRegNo !== regNo);
    await group.save();
  }
}

async function assignStudentToGroup(group, regNo) {
  await removeStudentFromAllGroups(regNo);
  group.studentRegs = [...new Set([...(group.studentRegs || []), regNo])];
  await group.save();
  return group;
}

async function replaceStudentRegAcrossGroups(oldRegNo, newRegNo) {
  if (oldRegNo === newRegNo) return;

  const groups = await Group.find({ studentRegs: oldRegNo });
  for (const group of groups) {
    group.studentRegs = [...new Set(
      group.studentRegs.map((currentRegNo) =>
        currentRegNo === oldRegNo ? newRegNo : currentRegNo
      )
    )];
    await group.save();
  }
}

async function buildAdminOverview() {
  const [admins, teachers, groups, students] = await Promise.all([
    Admin.find().sort({ isActive: -1, name: 1, email: 1 }),
    Teacher.find().sort({ name: 1, email: 1 }),
    Group.find().sort({ title: 1 }),
    Student.find().sort({ name: 1, regNo: 1 }),
  ]);

  const serializedAdmins = admins.map(serializeAdmin);
  const serializedTeachers = teachers.map(serializeTeacher);
  const serializedStudents = students.map(serializeStudent);
  const studentsByReg = new Map(serializedStudents.map((student) => [student.regNo, student]));
  const teachersById = new Map(serializedTeachers.map((teacher) => [teacher._id, teacher]));

  const serializedGroups = groups.map((group) => {
    const teacher = group.teacherId
      ? teachersById.get(group.teacherId.toString()) || null
      : null;
    const groupStudents = (group.studentRegs || [])
      .map((regNo) => studentsByReg.get(regNo))
      .filter(Boolean);

    return serializeGroup(group, {
      teacher,
      students: groupStudents,
    });
  });

  const groupsByTeacherId = new Map();
  for (const group of serializedGroups) {
    if (!group.teacherId) continue;
    if (!groupsByTeacherId.has(group.teacherId)) {
      groupsByTeacherId.set(group.teacherId, []);
    }
    groupsByTeacherId.get(group.teacherId).push(group);
  }

  const assignedRegs = new Set(
    serializedGroups.flatMap((group) => group.studentRegs || [])
  );

  const teacherCards = serializedTeachers.map((teacher) => {
    const teacherGroups = groupsByTeacherId.get(teacher._id) || [];
    const studentCount = teacherGroups.reduce(
      (count, group) => count + (group.students?.length || 0),
      0
    );

    return {
      ...teacher,
      groupCount: teacherGroups.length,
      studentCount,
      groups: teacherGroups,
    };
  });

  const unassignedGroups = serializedGroups.filter((group) => !group.teacherId);
  const unassignedStudents = serializedStudents.filter(
    (student) => !assignedRegs.has(student.regNo)
  );

  return {
    admins: serializedAdmins,
    bootstrapAdminEmails: getBootstrapAdminEmails(),
    teachers: teacherCards,
    groups: serializedGroups,
    students: serializedStudents,
    unassignedGroups,
    unassignedStudents,
    stats: {
      adminCount: serializedAdmins.filter((admin) => admin.isActive).length,
      teacherCount: teacherCards.length,
      groupCount: serializedGroups.length,
      studentCount: serializedStudents.length,
      unassignedGroupCount: unassignedGroups.length,
      unassignedStudentCount: unassignedStudents.length,
    },
  };
}

async function getLastAdminProtectionError(admin, nextIsActive) {
  const willDeactivate =
    Boolean(admin?.isActive) && (nextIsActive === false || nextIsActive === null);

  if (!willDeactivate) {
    return null;
  }

  const activeAdminCount = await Admin.countDocuments({ isActive: true });
  if (activeAdminCount > 1) {
    return null;
  }

  if (getBootstrapAdminEmails().length > 0) {
    return null;
  }

  return "Keep at least one active admin or configure SUPER_ADMIN_EMAILS for recovery access.";
}

app.post("/auth/google", googleSignIn);

app.post("/auth/logout", (req, res) => {
  res.clearCookie("session", getSessionCookieBaseOptions());

  res.json({ ok: true });
});

app.get("/auth/me", authMiddleware, async (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    teacher: req.user.role === "teacher" ? req.user.teacher : null,
  });
});

app.post(
  "/admin/import/teachers",
  authMiddleware,
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Upload an Excel file first" });
    }

    const workbook = await loadWorkbookFromUpload(req.file);
    const sheet = getWorkbookSheet(workbook, ["Teachers", "Teacher"]);
    if (!sheet) {
      return res.status(400).json({ error: "Teacher sheet not found" });
    }

    const headerMap = buildWorksheetHeaderMap(sheet);
    if (!hasWorksheetHeader(headerMap, ["email", "teacher email"])) {
      return res.status(400).json({ error: 'Teacher sheet must include an "email" column' });
    }

    const hasTeacherIdColumn = hasWorksheetHeader(headerMap, [
      "teacherId",
      "teacher id",
      "id",
    ]);
    const hasNameColumn = hasWorksheetHeader(headerMap, ["name", "teacher name"]);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const teacherId = getWorksheetValue(row, headerMap, ["teacherId", "teacher id", "id"]);
      const name = getWorksheetValue(row, headerMap, ["name", "teacher name"]);
      const email = normalizeEmail(
        getWorksheetValue(row, headerMap, ["email", "teacher email"])
      );

      if (!teacherId && !name && !email) {
        continue;
      }

      if (!email) {
        skipped += 1;
        errors.push(`Row ${rowNumber}: teacher email is required`);
        continue;
      }

      const existingTeacher = await findTeacherByEmail(email);
      if (existingTeacher) {
        if (hasTeacherIdColumn) existingTeacher.teacherId = teacherId;
        if (hasNameColumn) existingTeacher.name = name;
        await existingTeacher.save();
        updated += 1;
      } else {
        await Teacher.create({
          teacherId: hasTeacherIdColumn ? teacherId : "",
          name: hasNameColumn ? name : "",
          email,
        });
        created += 1;
      }
    }

    res.json({
      ok: true,
      created,
      updated,
      skipped,
      processed: created + updated,
      errors: errors.slice(0, 20),
    });
  }
);

app.post(
  "/admin/import/students",
  authMiddleware,
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Upload an Excel file first" });
    }

    const workbook = await loadWorkbookFromUpload(req.file);
    const sheet = getWorkbookSheet(workbook, ["Students", "Student"]);
    if (!sheet) {
      return res.status(400).json({ error: "Student sheet not found" });
    }

    const headerMap = buildWorksheetHeaderMap(sheet);
    if (
      !hasWorksheetHeader(headerMap, [
        "regNo",
        "reg no",
        "registration no",
        "registration number",
      ])
    ) {
      return res.status(400).json({ error: 'Student sheet must include a "regNo" column' });
    }

    const hasNameColumn = hasWorksheetHeader(headerMap, ["name", "student name"]);
    const hasEmailColumn = hasWorksheetHeader(headerMap, ["email", "student email"]);
    const hasBranchColumn = hasWorksheetHeader(headerMap, ["branch"]);
    const hasYearColumn = hasWorksheetHeader(headerMap, ["year"]);
    const hasMarksColumn = hasWorksheetHeader(headerMap, ["marks", "score"]);
    const hasGroupIdColumn = hasWorksheetHeader(headerMap, ["groupId", "group id"]);
    const hasGroupTitleColumn = hasWorksheetHeader(headerMap, ["groupTitle", "group title"]);
    const hasGroupTeacherEmailColumn = hasWorksheetHeader(headerMap, [
      "groupTeacherEmail",
      "group teacher email",
      "teacherEmail",
      "teacher email",
    ]);
    const shouldApplyGroupAssignment =
      hasGroupIdColumn || hasGroupTitleColumn || hasGroupTeacherEmailColumn;

    const [teachers, groups] = await Promise.all([Teacher.find(), Group.find()]);
    const teacherEmailById = new Map(
      teachers.map((teacher) => [teacher._id.toString(), normalizeEmail(teacher.email)])
    );

    function resolveImportGroup(groupIdValue, groupTitleValue, groupTeacherEmailValue) {
      const groupId = String(groupIdValue || "").trim();
      const groupTitle = String(groupTitleValue || "").trim();
      const groupTeacherEmail = normalizeEmail(groupTeacherEmailValue || "");

      if (groupId) {
        const directMatch = groups.find((group) => group._id.toString() === groupId);
        if (!directMatch) {
          return { error: `Group with ID "${groupId}" was not found` };
        }
        return { group: directMatch };
      }

      if (!groupTitle) {
        if (groupTeacherEmail) {
          return { error: "groupTitle is required when groupTeacherEmail is provided" };
        }
        return { group: null };
      }

      const matches = groups.filter((group) => {
        const titleMatches =
          String(group.title || "").trim().toLowerCase() === groupTitle.toLowerCase();
        if (!titleMatches) return false;

        if (!groupTeacherEmail) return true;

        const currentTeacherEmail = group.teacherId
          ? teacherEmailById.get(group.teacherId.toString()) || ""
          : "";

        return currentTeacherEmail === groupTeacherEmail;
      });

      if (matches.length === 0) {
        return { error: `Group "${groupTitle}" was not found` };
      }

      if (matches.length > 1) {
        return {
          error: `Multiple groups match "${groupTitle}". Add groupTeacherEmail or groupId.`,
        };
      }

      return { group: matches[0] };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const regNo = String(
        getWorksheetValue(row, headerMap, [
          "regNo",
          "reg no",
          "registration no",
          "registration number",
        ])
      ).trim();
      const name = getWorksheetValue(row, headerMap, ["name", "student name"]);
      const email = normalizeEmail(
        getWorksheetValue(row, headerMap, ["email", "student email"])
      );
      const branch = getWorksheetValue(row, headerMap, ["branch"]);
      const year = getWorksheetValue(row, headerMap, ["year"]);
      const marksRaw = getWorksheetValue(row, headerMap, ["marks", "score"]);
      const groupId = getWorksheetValue(row, headerMap, ["groupId", "group id"]);
      const groupTitle = getWorksheetValue(row, headerMap, ["groupTitle", "group title"]);
      const groupTeacherEmail = getWorksheetValue(row, headerMap, [
        "groupTeacherEmail",
        "group teacher email",
        "teacherEmail",
        "teacher email",
      ]);

      if (
        !regNo &&
        !name &&
        !email &&
        !branch &&
        !year &&
        !marksRaw &&
        !groupId &&
        !groupTitle &&
        !groupTeacherEmail
      ) {
        continue;
      }

      if (!regNo) {
        skipped += 1;
        errors.push(`Row ${rowNumber}: student regNo is required`);
        continue;
      }

      let parsedMarks = null;
      if (hasMarksColumn) {
        if (!String(marksRaw || "").trim()) {
          parsedMarks = 0;
        } else {
          parsedMarks = Number(marksRaw);
          if (Number.isNaN(parsedMarks)) {
            skipped += 1;
            errors.push(`Row ${rowNumber}: marks must be numeric`);
            continue;
          }
        }
      }

      let targetGroup = null;
      if (shouldApplyGroupAssignment) {
        const resolvedGroup = resolveImportGroup(groupId, groupTitle, groupTeacherEmail);
        if (resolvedGroup.error) {
          skipped += 1;
          errors.push(`Row ${rowNumber}: ${resolvedGroup.error}`);
          continue;
        }
        targetGroup = resolvedGroup.group;
      }

      const existingStudent = await Student.findOne({ regNo });
      if (existingStudent) {
        if (hasNameColumn) existingStudent.name = name;
        if (hasEmailColumn) existingStudent.email = email;

        const nextBranch = hasBranchColumn
          ? branch
          : existingStudent.otherDetails?.branch || "";
        const nextYear = hasYearColumn ? year : existingStudent.otherDetails?.year || "";
        existingStudent.otherDetails = {
          branch: nextBranch,
          year: nextYear,
        };

        if (hasMarksColumn) {
          existingStudent.marks = parsedMarks;
        }

        await existingStudent.save();

        if (shouldApplyGroupAssignment) {
          await removeStudentFromAllGroups(regNo);
          if (targetGroup) {
            await assignStudentToGroup(targetGroup, regNo);
          }
        }

        updated += 1;
      } else {
        const student = await Student.create({
          regNo,
          name: hasNameColumn ? name : "",
          email: hasEmailColumn ? email : "",
          otherDetails: {
            branch: hasBranchColumn ? branch : "",
            year: hasYearColumn ? year : "",
          },
          marks: hasMarksColumn ? parsedMarks : 0,
        });

        if (shouldApplyGroupAssignment && targetGroup) {
          await assignStudentToGroup(targetGroup, student.regNo);
        }

        created += 1;
      }
    }

    res.json({
      ok: true,
      created,
      updated,
      skipped,
      processed: created + updated,
      errors: errors.slice(0, 20),
    });
  }
);

app.get("/admin/export/workbook", authMiddleware, requireAdmin, async (req, res) => {
  const overview = await buildAdminOverview();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ProjectX";
  workbook.created = new Date();

  const adminsSheet = workbook.addWorksheet("Admins");
  adminsSheet.columns = [
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 34 },
    { header: "Is Active", key: "isActive", width: 14 },
    { header: "Created By", key: "createdByEmail", width: 34 },
  ];
  overview.admins.forEach((admin) => {
    adminsSheet.addRow({
      name: admin.name || "",
      email: admin.email || "",
      isActive: admin.isActive ? "Yes" : "No",
      createdByEmail: admin.createdByEmail || "",
    });
  });
  styleSheetHeader(adminsSheet);

  const teachersSheet = workbook.addWorksheet("Teachers");
  teachersSheet.columns = [
    { header: "Teacher ID", key: "teacherId", width: 18 },
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 34 },
  ];
  overview.teachers.forEach((teacher) => {
    teachersSheet.addRow({
      teacherId: teacher.teacherId || "",
      name: teacher.name || "",
      email: teacher.email || "",
    });
  });
  styleSheetHeader(teachersSheet);

  const groupsSheet = workbook.addWorksheet("Groups");
  groupsSheet.columns = [
    { header: "Group ID", key: "groupId", width: 28 },
    { header: "Title", key: "title", width: 26 },
    { header: "Subtitle", key: "subtitle", width: 32 },
    { header: "Teacher ID", key: "teacherId", width: 18 },
    { header: "Teacher Name", key: "teacherName", width: 28 },
    { header: "Teacher Email", key: "teacherEmail", width: 34 },
    { header: "Student Count", key: "studentCount", width: 16 },
    { header: "Group Marks", key: "groupMarks", width: 16 },
  ];
  overview.groups.forEach((group) => {
    groupsSheet.addRow({
      groupId: group._id,
      title: group.title || "",
      subtitle: group.subtitle || "",
      teacherId: group.teacher?.teacherId || "",
      teacherName: group.teacher?.name || "",
      teacherEmail: group.teacher?.email || "",
      studentCount: group.studentCount || 0,
      groupMarks: group.groupMarks ?? "",
    });
  });
  styleSheetHeader(groupsSheet);

  const groupByStudentReg = new Map();
  overview.groups.forEach((group) => {
    (group.studentRegs || []).forEach((regNo) => {
      groupByStudentReg.set(regNo, group);
    });
  });

  const studentsSheet = workbook.addWorksheet("Students");
  studentsSheet.columns = [
    { header: "Reg No", key: "regNo", width: 20 },
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 34 },
    { header: "Branch", key: "branch", width: 18 },
    { header: "Year", key: "year", width: 14 },
    { header: "Marks", key: "marks", width: 12 },
    { header: "Group ID", key: "groupId", width: 28 },
    { header: "Group Title", key: "groupTitle", width: 26 },
    { header: "Group Teacher Email", key: "groupTeacherEmail", width: 34 },
  ];
  overview.students.forEach((student) => {
    const assignedGroup = groupByStudentReg.get(student.regNo);
    studentsSheet.addRow({
      regNo: student.regNo || "",
      name: student.name || "",
      email: student.email || "",
      branch: student.otherDetails?.branch || "",
      year: student.otherDetails?.year || "",
      marks: student.marks ?? 0,
      groupId: assignedGroup?._id || "",
      groupTitle: assignedGroup?.title || "",
      groupTeacherEmail: assignedGroup?.teacher?.email || "",
    });
  });
  styleSheetHeader(studentsSheet);

  const fileName = `projectx-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  setExcelDownloadHeaders(res, fileName);
  res.send(Buffer.from(buffer));
});

app.get("/groups", authMiddleware, requireTeacher, async (req, res) => {
  const groups = await Group.find({ teacherId: req.user.teacher._id }).sort({ title: 1 });
  res.json(groups.map((group) => serializeGroup(group)));
});

app.post("/groups", authMiddleware, requireTeacher, async (req, res) => {
  const title = String(req.body.title || "").trim();
  const subtitle = String(req.body.subtitle || "").trim();
  const banner = String(req.body.banner || "#60A5FA").trim() || "#60A5FA";

  if (!title) {
    return res.status(400).json({ error: "Group title is required" });
  }

  const group = await new Group({
    title,
    subtitle,
    banner,
    teacherId: req.user.teacher._id,
  }).save();

  res.status(201).json(serializeGroup(group));
});

app.get("/groups/:id", authMiddleware, requireTeacher, async (req, res) => {
  const group = await getManagedGroup(req, res);
  if (!group) return;

  const students = await Student.find({ regNo: { $in: group.studentRegs || [] } });
  res.json({
    group: serializeGroup(group),
    students: students.map(serializeStudent),
  });
});

app.post("/groups/:id/add-student", authMiddleware, requireTeacher, async (req, res) => {
  const regNo = String(req.body.regNo || "").trim();
  if (!regNo) {
    return res.status(400).json({ error: "Student regNo is required" });
  }

  const group = await getManagedGroup(req, res);
  if (!group) return;

  const student = await Student.findOne({ regNo });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const existingGroup = await Group.findOne({ studentRegs: regNo });
  if (existingGroup) {
    return res.status(400).json({ error: "Student already in a group" });
  }

  group.studentRegs = [...new Set([...(group.studentRegs || []), regNo])];
  await group.save();

  res.json(serializeGroup(group));
});

app.post("/groups/:id/edit", authMiddleware, requireTeacher, async (req, res) => {
  const group = await getManagedGroup(req, res);
  if (!group) return;

  const { title, subtitle } = req.body;

  if (title !== undefined) {
    const nextTitle = String(title).trim();
    if (!nextTitle) {
      return res.status(400).json({ error: "Group title cannot be empty" });
    }
    group.title = nextTitle;
  }

  if (subtitle !== undefined) {
    group.subtitle = String(subtitle).trim();
  }

  await group.save();

  res.json({ ok: true, group: serializeGroup(group) });
});

app.delete("/groups/:id", authMiddleware, requireTeacher, async (req, res) => {
  const group = await getManagedGroup(req, res);
  if (!group) return;

  await group.deleteOne();
  res.json({ ok: true, message: "Group deleted" });
});

app.post("/groups/:id/remove-student", authMiddleware, requireTeacher, async (req, res) => {
  const regNo = String(req.body.regNo || "").trim();
  const group = await getManagedGroup(req, res);
  if (!group) return;

  if (!group.studentRegs.includes(regNo)) {
    return res.status(400).json({ error: "Student not in this group" });
  }

  group.studentRegs = group.studentRegs.filter((currentRegNo) => currentRegNo !== regNo);
  await group.save();

  res.json({ ok: true, message: "Student removed", group: serializeGroup(group) });
});

app.post("/students/:regNo/add-mark", authMiddleware, requireTeacher, async (req, res) => {
  const groupId = req.body.groupId;
  const parsedMarks = parseNullableNumber(req.body.marks, "Marks");
  if (!parsedMarks.ok || !parsedMarks.hasValue || parsedMarks.value === null) {
    return res.status(400).json({ error: parsedMarks.error || "Marks are required." });
  }

  if (groupId) {
    const managedGroup = await getManagedGroup(
      { ...req, params: { id: groupId } },
      res
    );
    if (!managedGroup) return;

    if (!managedGroup.studentRegs.includes(req.params.regNo)) {
      return res.status(400).json({ error: "Student is not in this group" });
    }
  } else {
    const group = await Group.findOne({ studentRegs: req.params.regNo });
    if (!group || group.teacherId?.toString() !== req.user.teacher._id) {
      return res.status(403).json({ error: "You cannot edit this student's marks" });
    }
  }

  const student = await Student.findOne({ regNo: req.params.regNo });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  student.marks = parsedMarks.value;
  await student.save();

  res.json({ ok: true, message: "Marks updated", student: serializeStudent(student) });
});

app.post("/groups/:id/set-marks", authMiddleware, requireTeacher, async (req, res) => {
  const group = await getManagedGroup(req, res);
  if (!group) return;

  const scoreInput =
    req.body.score !== undefined ? req.body.score : req.body.marks;
  const parsedScore = parseNullableNumber(scoreInput, "Score");
  if (!parsedScore.ok || !parsedScore.hasValue) {
    return res.status(400).json({ error: parsedScore.error || "Score is required." });
  }

  group.groupMarks = parsedScore.value;
  group.groupMarksUpdatedAt = parsedScore.value === null ? null : new Date();
  await group.save();

  res.json({ ok: true, group: serializeGroup(group) });
});

app.get("/search", authMiddleware, requireTeacher, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) {
    return res.json({ groups: [], students: [] });
  }

  const groups = await Group.find({
    teacherId: req.user.teacher._id,
    $or: [{ title: new RegExp(q, "i") }, { subtitle: new RegExp(q, "i") }],
  }).limit(20);

  const ownedGroups = await Group.find({ teacherId: req.user.teacher._id });
  const studentRegs = [...new Set(ownedGroups.flatMap((group) => group.studentRegs || []))];
  const students = studentRegs.length
    ? await Student.find({
        regNo: { $in: studentRegs },
        $or: [{ regNo: new RegExp(q, "i") }, { name: new RegExp(q, "i") }],
      }).limit(20)
    : [];

  res.json({
    groups: groups.map((group) => serializeGroup(group)),
    students: students.map(serializeStudent),
  });
});

app.get("/student/:regNo/group", authMiddleware, requireTeacher, async (req, res) => {
  const group = await Group.findOne({
    teacherId: req.user.teacher._id,
    studentRegs: req.params.regNo,
  });

  res.json({ group: group ? serializeGroup(group) : null });
});

app.get("/admin/overview", authMiddleware, requireAdmin, async (req, res) => {
  const overview = await buildAdminOverview();
  res.json(overview);
});

app.post("/admin/admins", authMiddleware, requireAdmin, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const name = String(req.body.name || "").trim();
  const isActive = req.body.isActive !== false;

  if (!email) {
    return res.status(400).json({ error: "Admin email is required" });
  }

  const existingAdmin = await findActiveAdminByEmail(email);
  if (existingAdmin) {
    return res.status(400).json({ error: "An active admin with this email already exists" });
  }

  const duplicateAdmin = await Admin.findOne({
    email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  if (duplicateAdmin) {
    return res.status(400).json({ error: "An admin with this email already exists" });
  }

  const admin = await Admin.create({
    email,
    name,
    isActive,
    createdByEmail: req.user.email,
  });

  res.status(201).json({ ok: true, admin: serializeAdmin(admin) });
});

app.put("/admin/admins/:id", authMiddleware, requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    return res.status(404).json({ error: "Admin not found" });
  }

  const nextEmail =
    req.body.email !== undefined ? normalizeEmail(req.body.email) : admin.email;
  if (!nextEmail) {
    return res.status(400).json({ error: "Admin email is required" });
  }

  const duplicateAdmin = await Admin.findOne({
    email: new RegExp(`^${nextEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  if (duplicateAdmin && duplicateAdmin._id.toString() !== admin._id.toString()) {
    return res.status(400).json({ error: "An admin with this email already exists" });
  }

  const nextIsActive =
    req.body.isActive !== undefined ? Boolean(req.body.isActive) : admin.isActive;
  const protectionError = await getLastAdminProtectionError(admin, nextIsActive);
  if (protectionError) {
    return res.status(400).json({ error: protectionError });
  }

  admin.email = nextEmail;
  if (req.body.name !== undefined) {
    admin.name = String(req.body.name || "").trim();
  }
  admin.isActive = nextIsActive;
  await admin.save();

  res.json({ ok: true, admin: serializeAdmin(admin) });
});

app.delete("/admin/admins/:id", authMiddleware, requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    return res.status(404).json({ error: "Admin not found" });
  }

  const protectionError = await getLastAdminProtectionError(admin, false);
  if (protectionError) {
    return res.status(400).json({ error: protectionError });
  }

  await admin.deleteOne();
  res.json({ ok: true, message: "Admin deleted" });
});

app.post("/admin/teachers", authMiddleware, requireAdmin, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const name = String(req.body.name || "").trim();
  const teacherId = String(req.body.teacherId || "").trim();

  if (!email) {
    return res.status(400).json({ error: "Teacher email is required" });
  }

  const existingTeacher = await findTeacherByEmail(email);
  if (existingTeacher) {
    return res.status(400).json({ error: "A teacher with this email already exists" });
  }

  const teacher = await Teacher.create({
    teacherId,
    name,
    email,
  });

  res.status(201).json({ ok: true, teacher: serializeTeacher(teacher) });
});

app.put("/admin/teachers/:id", authMiddleware, requireAdmin, async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  const nextEmail =
    req.body.email !== undefined ? normalizeEmail(req.body.email) : teacher.email;
  if (!nextEmail) {
    return res.status(400).json({ error: "Teacher email is required" });
  }

  const duplicateTeacher = await findTeacherByEmail(nextEmail);
  if (duplicateTeacher) {
    if (duplicateTeacher._id.toString() !== teacher._id.toString()) {
      return res.status(400).json({ error: "A teacher with this email already exists" });
    }
  }

  teacher.email = nextEmail;
  if (req.body.name !== undefined) teacher.name = String(req.body.name || "").trim();
  if (req.body.teacherId !== undefined) {
    teacher.teacherId = String(req.body.teacherId || "").trim();
  }

  await teacher.save();

  res.json({ ok: true, teacher: serializeTeacher(teacher) });
});

app.delete("/admin/teachers/:id", authMiddleware, requireAdmin, async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  const groupCount = await Group.countDocuments({ teacherId: teacher._id });
  if (groupCount > 0) {
    return res.status(400).json({
      error: "This teacher still owns groups. Reassign or delete those groups first.",
    });
  }

  await teacher.deleteOne();
  res.json({ ok: true, message: "Teacher deleted" });
});

app.post("/admin/groups", authMiddleware, requireAdmin, async (req, res) => {
  const title = String(req.body.title || "").trim();
  const subtitle = String(req.body.subtitle || "").trim();
  const banner = String(req.body.banner || "#0F766E").trim() || "#0F766E";
  const teacherId = String(req.body.teacherId || "").trim();

  if (!title) {
    return res.status(400).json({ error: "Group title is required" });
  }

  let teacherObjectId = null;
  if (teacherId) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Assigned teacher not found" });
    }
    teacherObjectId = teacher._id;
  }

  const groupMarks = parseNullableNumber(req.body.groupMarks, "Group marks");
  if (!groupMarks.ok) {
    return res.status(400).json({ error: groupMarks.error });
  }

  const group = await Group.create({
    title,
    subtitle,
    banner,
    teacherId: teacherObjectId,
    groupMarks: groupMarks.hasValue ? groupMarks.value : null,
    groupMarksUpdatedAt:
      groupMarks.hasValue && groupMarks.value !== null ? new Date() : null,
  });

  res.status(201).json({ ok: true, group: serializeGroup(group) });
});

app.put("/admin/groups/:id", authMiddleware, requireAdmin, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (req.body.title !== undefined) {
    const title = String(req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "Group title is required" });
    }
    group.title = title;
  }

  if (req.body.subtitle !== undefined) {
    group.subtitle = String(req.body.subtitle || "").trim();
  }

  if (req.body.banner !== undefined) {
    group.banner = String(req.body.banner || "").trim() || "#0F766E";
  }

  if (req.body.teacherId !== undefined) {
    const nextTeacherId = String(req.body.teacherId || "").trim();
    if (!nextTeacherId) {
      group.teacherId = null;
    } else {
      const teacher = await Teacher.findById(nextTeacherId);
      if (!teacher) {
        return res.status(404).json({ error: "Assigned teacher not found" });
      }
      group.teacherId = teacher._id;
    }
  }

  const parsedGroupMarks = parseNullableNumber(req.body.groupMarks, "Group marks");
  if (!parsedGroupMarks.ok) {
    return res.status(400).json({ error: parsedGroupMarks.error });
  }
  if (parsedGroupMarks.hasValue) {
    group.groupMarks = parsedGroupMarks.value;
    group.groupMarksUpdatedAt =
      parsedGroupMarks.value === null ? null : new Date();
  }

  await group.save();

  res.json({ ok: true, group: serializeGroup(group) });
});

app.delete("/admin/groups/:id", authMiddleware, requireAdmin, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  await group.deleteOne();
  res.json({ ok: true, message: "Group deleted" });
});

app.post("/admin/groups/:id/add-student", authMiddleware, requireAdmin, async (req, res) => {
  const regNo = String(req.body.regNo || "").trim();
  if (!regNo) {
    return res.status(400).json({ error: "Student regNo is required" });
  }

  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const student = await Student.findOne({ regNo });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  await assignStudentToGroup(group, regNo);
  res.json({ ok: true, group: serializeGroup(group) });
});

app.post("/admin/groups/:id/remove-student", authMiddleware, requireAdmin, async (req, res) => {
  const regNo = String(req.body.regNo || "").trim();
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  group.studentRegs = group.studentRegs.filter((currentRegNo) => currentRegNo !== regNo);
  await group.save();

  res.json({ ok: true, group: serializeGroup(group) });
});

app.post("/admin/students", authMiddleware, requireAdmin, async (req, res) => {
  const regNo = String(req.body.regNo || "").trim();
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email || "");
  const branch = String(req.body.branch || "").trim();
  const year = String(req.body.year || "").trim();
  const marks = parseNullableNumber(req.body.marks, "Marks");
  const groupId = String(req.body.groupId || "").trim();

  if (!regNo) {
    return res.status(400).json({ error: "Student regNo is required" });
  }

  if (!marks.ok) {
    return res.status(400).json({ error: marks.error });
  }

  const existingStudent = await Student.findOne({ regNo });
  if (existingStudent) {
    return res.status(400).json({ error: "A student with this regNo already exists" });
  }

  let targetGroup = null;
  if (groupId) {
    targetGroup = await Group.findById(groupId);
    if (!targetGroup) {
      return res.status(404).json({ error: "Assigned group not found" });
    }
  }

  const student = await Student.create({
    regNo,
    name,
    email,
    otherDetails: { branch, year },
    marks: marks.hasValue ? marks.value ?? 0 : 0,
  });

  if (targetGroup) {
    await assignStudentToGroup(targetGroup, regNo);
  }

  res.status(201).json({ ok: true, student: serializeStudent(student) });
});

app.put("/admin/students/:regNo", authMiddleware, requireAdmin, async (req, res) => {
  const student = await Student.findOne({ regNo: req.params.regNo });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const nextRegNo =
    req.body.regNo !== undefined
      ? String(req.body.regNo || "").trim()
      : student.regNo;
  if (!nextRegNo) {
    return res.status(400).json({ error: "Student regNo is required" });
  }

  if (nextRegNo !== student.regNo) {
    const duplicateStudent = await Student.findOne({ regNo: nextRegNo });
    if (duplicateStudent) {
      return res.status(400).json({ error: "A student with this regNo already exists" });
    }
  }

  const parsedMarks = parseNullableNumber(req.body.marks, "Marks");
  if (!parsedMarks.ok) {
    return res.status(400).json({ error: parsedMarks.error });
  }

  let targetGroup = null;
  if (req.body.groupId !== undefined) {
    const groupId = String(req.body.groupId || "").trim();
    if (groupId) {
      targetGroup = await Group.findById(groupId);
      if (!targetGroup) {
        return res.status(404).json({ error: "Assigned group not found" });
      }
    }
  }

  const previousRegNo = student.regNo;
  student.regNo = nextRegNo;
  if (req.body.name !== undefined) student.name = String(req.body.name || "").trim();
  if (req.body.email !== undefined) student.email = normalizeEmail(req.body.email || "");

  const nextBranch =
    req.body.branch !== undefined
      ? String(req.body.branch || "").trim()
      : student.otherDetails?.branch || "";
  const nextYear =
    req.body.year !== undefined
      ? String(req.body.year || "").trim()
      : student.otherDetails?.year || "";
  student.otherDetails = { branch: nextBranch, year: nextYear };

  if (parsedMarks.hasValue) {
    student.marks = parsedMarks.value ?? 0;
  }

  await student.save();
  await replaceStudentRegAcrossGroups(previousRegNo, nextRegNo);

  if (req.body.groupId !== undefined) {
    await removeStudentFromAllGroups(nextRegNo);
    if (targetGroup) {
      await assignStudentToGroup(targetGroup, nextRegNo);
    }
  }

  res.json({ ok: true, student: serializeStudent(student) });
});

app.delete("/admin/students/:regNo", authMiddleware, requireAdmin, async (req, res) => {
  const student = await Student.findOne({ regNo: req.params.regNo });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  await removeStudentFromAllGroups(student.regNo);
  await student.deleteOne();

  res.json({ ok: true, message: "Student deleted" });
});

app.listen(process.env.PORT || 4000, () =>
  console.log("Server running on port", process.env.PORT || 4000)
);
