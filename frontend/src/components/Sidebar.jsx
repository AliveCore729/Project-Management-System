import React from "react";
import { Home, Users, FileText, Calendar, Upload } from "lucide-react";

const Item = ({ Icon, label }) => (
  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition">
    <Icon size={20} className="text-gray-700" />
    <span className="hidden group-hover:block text-sm text-gray-700">
      {label}
    </span>
  </div>
);

export default function Sidebar() {
  return (
    <aside
      className="
        fixed               /* 🔥 stays like YouTube */
        top-16              /* 🔥 below navbar */
        left-0
        h-[calc(100vh-4rem)]   /* full height minus navbar */
        bg-white
        border-r
        z-40
        group
        w-16
        hover:w-64
        transition-all
        duration-200
        overflow-hidden
        shadow-sm
      "
    >
      <div className="p-3 flex flex-col gap-1">

        {/* Logo Area */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="hidden group-hover:block font-semibold text-gray-800">
            ProjectManagement
          </span>
        </div>

        {/* Menu Items */}
        <div className="mt-4">
          <Item Icon={Home} label="Home" />
          {/* <Item Icon={Users} label="Groups" /> */}
          {/* <Item Icon={FileText} label="Projects" /> */}
          {/* <Item Icon={Calendar} label="Calendar" /> */}
        </div>

        {/* Separator + Upload */}
        {/* <div className="mt-4 border-t pt-3">
          <Item Icon={Upload} label="Upload Students" />
        </div> */}
      </div>
    </aside>
  );
}
