import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function AppDialog({
  open,
  title,
  description,
  children,
  actions,
  onClose,
  width = "max-w-md",
  closeOnOverlay = true,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(24,22,41,0.55)] p-4 backdrop-blur-md"
          onClick={closeOnOverlay ? onClose : undefined}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`w-full ${width} rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.98)] p-5 shadow-[0_40px_100px_-48px_rgba(35,26,16,0.42)] dark:border-slate-800 dark:bg-slate-950/96`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29386] dark:text-slate-500">
                  Action
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h3>
                {description ? (
                  <p className="mt-2 text-sm text-[#8b7e73] dark:text-slate-400">
                    {description}
                  </p>
                ) : null}
              </div>

              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] text-slate-700 transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>

            <div className="mt-5">{children}</div>
            {actions ? <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
