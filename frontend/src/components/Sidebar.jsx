import React from "react";
import { Home, Users, FileText, Calendar, Upload } from "lucide-react";

const Item = ({ Icon, label }) => (
  <div className="group/item flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-all duration-200">
    <Icon size={22} className="text-gray-500 group-hover/item:text-red-600 dark:text-gray-400 dark:group-hover/item:text-red-400 transition-colors" />
    <span className="hidden group-hover:block whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200 group-hover/item:text-red-700 dark:group-hover/item:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
      {label}
    </span>
  </div>
);

export default function Sidebar() {
  return (
    <aside
      className="
        fixed left-0 top-16 bottom-0 z-40
        w-[70px] hover:w-64
        bg-white dark:bg-gray-900 
        border-r border-gray-200 dark:border-gray-800
        shadow-xl shadow-gray-200/50 dark:shadow-none
        transition-all duration-300 ease-in-out
        group overflow-hidden
      "
    >
      <div className="flex flex-col h-full py-4 px-2 gap-1">
        
        {/* Menu Items */}
        <div className="mt-2 space-y-1">
          <Item Icon={Home} label="Home" />
          {/* Uncomment these when you have routes for them */}
          {/* <Item Icon={Users} label="Groups" /> */}
          {/* <Item Icon={FileText} label="Projects" /> */}
          {/* <Item Icon={Calendar} label="Calendar" /> */}
        </div>

        {/* Separator */}
        {/* <div className="my-2 border-t border-gray-100 dark:border-gray-800 mx-2" /> */}

        {/* <div className="mt-auto">
          <Item Icon={Upload} label="Upload Students" />
        </div> */}
      </div>
    </aside>
  );
}