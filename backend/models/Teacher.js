const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: { type: String, unique: true },
});
module.exports = mongoose.model("Teacher", schema);
