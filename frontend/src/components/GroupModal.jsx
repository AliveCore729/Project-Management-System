import React, { useEffect, useState } from "react";
import API from "../api";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupModal({ group, onClose }) {
  const [students, setStudents] = useState([]);
  const [regNo, setRegNo] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const res = await API.get(`/groups/${group._id}`);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  }

  async function addStudent() {
    if (!regNo) return alert("Enter student regNo");
    try {
      await API.post(`/groups/${group._id}/add-student`, { regNo });
      setRegNo("");
      await fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add student");
    }
  }

  async function removeStudent(regNo) {
    if (!window.confirm(`Remove student ${regNo}?`)) return;

    try {
      await API.post(`/groups/${group._id}/remove-student`, { regNo });
      setStudents((prev) => prev.filter((s) => s.regNo !== regNo));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to remove student");
    }
  }

  async function giveMarkToStudent(regNo) {
    try {
      const input = prompt("Enter marks (numeric):");
      if (input === null) return;

      const marks = Number(input);
      if (Number.isNaN(marks)) return alert("Enter a valid number.");

      await API.post(`/students/${regNo}/add-mark`, { marks });
      await fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to update marks");
    }
  }

  async function setGroupMarks() {
    try {
      const input = prompt("Enter group score:");
      if (input === null) return;

      const score = Number(input);
      if (Number.isNaN(score)) return alert("Enter a valid number.");

      await API.post(`/groups/${group._id}/set-marks`, { score });
      await fetchStudents();
    } catch (err) {
      alert("Failed to set group marks");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm z-50"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl p-6"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              {group.title} — {group.subtitle}
            </h2>

            <div className="flex gap-3">
              <button
                onClick={setGroupMarks}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Set Group Marks
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>

          {/* ADD STUDENT INPUT */}
          <div className="mb-5 flex items-center gap-3">
            <input
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="Enter student regNo"
              className="border rounded-lg p-2 flex-1 focus:ring focus:ring-blue-200 transition"
            />
            <button
              onClick={addStudent}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Add
            </button>
          </div>

          {/* STUDENT LIST */}
          <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
            {students.length === 0 && (
              <p className="text-sm text-gray-500">No students in this group.</p>
            )}

            <AnimatePresence>
              {students.map((s) => (
                <motion.div
                  key={s.regNo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition bg-gray-50"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      {s.name} ({s.regNo})
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Marks: {s.marks ?? "-"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => giveMarkToStudent(s.regNo)}
                      className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition"
                    >
                      Give Mark
                    </button>
                    <button
                      onClick={() => removeStudent(s.regNo)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-white transition"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
