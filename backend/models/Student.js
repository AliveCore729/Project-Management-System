const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  regNo: { type: String, unique: true, required: true },
  name: String,
  email: String,
  otherDetails: Object,
  marks: { type: Number, default: 0 }
});

module.exports = mongoose.model('Student', StudentSchema);
