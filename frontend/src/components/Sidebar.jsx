import React from "react";

function groupItems(items) {
  return items.reduce((sections, item) => {
    const sectionKey = item.section || "Workspace";
    const existing = sections.find((section) => section.label === sectionKey);

    if (existing) {
      existing.items.push(item);
      return sections;
    }

    sections.push({ label: sectionKey, items: [item] });
    return sections;
  }, []);
}

function NavButton({ item, active, onClick }) {
  const Icon = item.Icon;

  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className={`group relative flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all ${
        active
          ? "border-white/6 bg-[rgba(240,92,135,0.16)] text-white"
          : "border-transparent text-[#c3bdd8] hover:border-white/6 hover:bg-white/6 hover:text-white"
      }`}
    >
      {active ? (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#f05c87]" />
      ) : null}

      <span
        className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
          active ? "bg-white/10 text-white" : "bg-white/6 text-[#c3bdd8]"
        }`}
      >
        <Icon size={17} />
      </span>

      <span className="hidden min-w-0 flex-1 xl:block">
        <span className="block truncate text-sm font-semibold">{item.label}</span>
        {item.note ? (
          <span className="mt-0.5 block truncate text-[11px] text-[#948cae]">{item.note}</span>
        ) : null}
      </span>
    </button>
  );
}

export default function Sidebar({ items = [], activeView, onChange, teacher }) {
  const sections = groupItems(items);

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[108px] overflow-hidden border-r border-white/6 bg-[#181629] text-white lg:block xl:w-[280px]">
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,_rgba(240,92,135,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(53,199,243,0.12),_transparent_36%)]" />

      <div className="relative flex h-full flex-col px-4 py-5 xl:px-4">
        <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f05c87] text-sm font-black text-white shadow-[0_18px_40px_-22px_rgba(240,92,135,0.75)]">
              PX
            </div>
            <div className="hidden xl:block">
              <div className="text-sm font-bold tracking-tight text-white">ProjectX</div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8d86a7]">
                Workspace
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="hidden px-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#716a8d] xl:block">
                {section.label}
              </div>
              <div className="mt-3 space-y-1.5">
                {section.items.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={item.id === activeView}
                    onClick={onChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
          <div className="hidden text-[10px] font-semibold uppercase tracking-[0.32em] text-[#716a8d] xl:block">
            Account
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-white xl:mt-3">
            {teacher?.name || "Teacher"}
          </div>
          <div className="mt-1 truncate text-xs text-[#948cae]">{teacher?.email || ""}</div>
          <div className="mt-4 hidden rounded-[18px] border border-white/8 bg-[#121021] px-3 py-3 xl:block">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#716a8d]">Teacher ID</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {teacher?.teacherId || "-"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
