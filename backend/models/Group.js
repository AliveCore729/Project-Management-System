const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  title: String,
  subtitle: String,
  banner: String,
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  studentRegs: {
    type: [String],
    default: [],
  },
  groupMarks: {
    type: Number,
    default: null,
  },
  groupMarksUpdatedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Group", schema);
