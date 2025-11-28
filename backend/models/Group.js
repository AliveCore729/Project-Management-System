const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  title: String,
  subtitle: String,
  banner: String,
  teacherId: mongoose.Schema.Types.ObjectId,
  studentRegs: [String],
  
  groupMarks: {
    type: Number,
    default: null,
  },
});

module.exports = mongoose.model("Group", schema);
