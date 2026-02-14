const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const ExcelJS = require("exceljs");
const jwt = require("jsonwebtoken");
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
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


const upload = multer({ dest: "uploads/" });

// Models
const Teacher = require("./models/Teacher");
const Student = require("./models/Student");
const Group = require("./models/Group");
const { googleSignIn } = require("./controllers/authController");

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auth route
app.post("/auth/google", googleSignIn);

app.post("/auth/logout", (req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  res.json({ ok: true });
});


// Auth middleware
function authMiddleware(req, res, next) {
  const token =
    req.cookies.session ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Upload teachers
app.post("/upload/teachers", upload.single("file"), async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(req.file.path);
  const sheet = workbook.worksheets[0];
  const teachers = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    const [teacherId, name, email] = row.values.slice(1);
    teachers.push({ teacherId, name, email });
  });
  for (const t of teachers)
    await Teacher.updateOne({ email: t.email }, { $set: t }, { upsert: true });
  res.json({ ok: true, inserted: teachers.length });
});

// Upload students
app.post("/upload/students", authMiddleware, upload.single("file"), async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(req.file.path);
  const sheet = workbook.worksheets[0];
  const students = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    const [regNo, name, email, branch, year] = row.values.slice(1);
    students.push({ regNo, name, email, otherDetails: { branch, year } });
  });
  for (const s of students)
    await Student.updateOne({ regNo: s.regNo }, { $set: s }, { upsert: true });
  res.json({ ok: true, inserted: students.length });
});

// Groups CRUD
app.get("/groups", authMiddleware, async (req, res) => {
  const teacher = await Teacher.findOne({ email: req.user.email });
  const groups = await Group.find({ teacherId: teacher._id });
  res.json(groups);
});

app.post("/groups", authMiddleware, async (req, res) => {
  const { title, subtitle, banner } = req.body;
  const teacher = await Teacher.findOne({ email: req.user.email });
  const group = await new Group({
    title,
    subtitle,
    banner,
    teacherId: teacher._id,
  }).save();
  res.json(group);
});

app.post("/groups/:id/add-student", authMiddleware, async (req, res) => {
  const { regNo } = req.body;
  const group = await Group.findById(req.params.id);
  const student = await Student.findOne({ regNo });
  if (!student) return res.status(404).json({ error: "Student not found" });
  const exists = await Group.findOne({ studentRegs: regNo });
  if (exists) return res.status(400).json({ error: "Student already in a group" });
  group.studentRegs.push(regNo);
  await group.save();
  res.json(group);
});

app.post("/groups/:id/edit", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle } = req.body;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (title) group.title = title;
    if (subtitle) group.subtitle = subtitle;

    await group.save();
    res.json({ ok: true, group });
  } catch (err) {
    console.error("Edit group error:", err);
    res.status(500).json({ error: "Failed to edit group" });
  }
});

app.delete("/groups/:id", authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    await Group.deleteOne({ _id: req.params.id });
    res.json({ ok: true, message: "Group deleted" });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

// Remove a student from a group
app.post("/groups/:id/remove-student", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { regNo } = req.body;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Check if student exists in group
    if (!group.studentRegs.includes(regNo)) {
      return res.status(400).json({ error: "Student not in this group" });
    }

    // Remove the student from group
    group.studentRegs = group.studentRegs.filter(r => r !== regNo);
    await group.save();

    res.json({ ok: true, message: "Student removed", group });
  } catch (err) {
    console.error("Error removing student:", err);
    res.status(500).json({ error: "Failed to remove student" });
  }
});


// app.post("/students/:regNo/add-mark", authMiddleware, async (req, res) => {
//   const { regNo } = req.params;
//   const { assignment, score, maxScore, groupId } = req.body;
//   const s = await Student.findOne({ regNo });
//   s.marks.push({ assignment, score, maxScore, groupId });
//   await s.save();
//   res.json({ ok: true, student: s });
// });
// in your backend server file (server.js or routes file) replace the old handler with this:

app.post('/students/:regNo/add-mark', authMiddleware, async (req, res) => {
  try {
    const { regNo } = req.params;
    const { marks } = req.body; // expect numeric marks

    if (typeof marks !== 'number') {
      // try to coerce numeric strings to number
      const n = Number(marks);
      if (Number.isNaN(n)) {
        return res.status(400).json({ error: 'Invalid marks. Must be a number.' });
      }
      req.body.marks = n;
    }

    const student = await Student.findOne({ regNo });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.marks = Number(req.body.marks);
    await student.save();

    return res.json({ ok: true, message: 'Marks updated', student });
  } catch (err) {
    console.error('Error updating student marks:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




app.get("/groups/:id", authMiddleware, async (req, res) => {
  const group = await Group.findById(req.params.id);
  const students = await Student.find({ regNo: { $in: group.studentRegs } });
  res.json({ group, students });
});

app.post('/groups/:id/set-marks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Accept either { score } or { marks } for compatibility
    let { score, marks } = req.body;
    if (score === undefined && marks !== undefined) score = marks;
    if (score === undefined) return res.status(400).json({ error: 'Missing score' });

    const numericScore = Number(score);
    if (Number.isNaN(numericScore)) return res.status(400).json({ error: 'Score must be a number' });

    const g = await Group.findById(id);
    if (!g) return res.status(404).json({ error: 'Group not found' });

    g.groupMarks = numericScore;
    g.groupMarksUpdatedAt = new Date();
    await g.save();

    res.json({ ok: true, group: g });
  } catch (err) {
    console.error('Error setting group marks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔍 Unified search route
app.get("/search", authMiddleware, async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ groups: [], students: [] });

  const teacher = await Teacher.findOne({ email: req.user.email });

  // Find groups owned by teacher
  const groups = await Group.find({
    teacherId: teacher._id,
    $or: [
      { title: new RegExp(q, "i") },
      { subtitle: new RegExp(q, "i") }
    ]
  });

  // Find matching students
  const students = await Student.find({
    $or: [
      { regNo: new RegExp(q, "i") },
      { name: new RegExp(q, "i") }
    ]
  }).limit(10);

  res.json({ groups, students });
});
// Find group by student regNo
app.get("/student/:regNo/group", authMiddleware, async (req, res) => {
  const { regNo } = req.params;

  const group = await Group.findOne({ studentRegs: regNo });

  if (!group) return res.json({ group: null });

  res.json({ group });
});

app.get("/auth/me", authMiddleware, async (req, res) => {
  const teacher = await Teacher.findOne({ email: req.user.email });
  res.json({ ok: true, teacher });
});




app.listen(process.env.PORT || 4000, () =>
  console.log("Server running on port", process.env.PORT || 4000)
);
