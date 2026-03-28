const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    name: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    createdByEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
