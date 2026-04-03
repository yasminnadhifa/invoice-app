const STYLE_MAP: Record<string, string> = {
  // Status
  pending:  "bg-amber-50 text-amber-600 border border-amber-200",
  approved: "bg-blue-50 text-blue-600 border border-blue-200",
  paid:     "bg-emerald-50 text-emerald-600 border border-emerald-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  overdue:  "bg-orange-50 text-orange-600 border border-orange-200",
  // Validation
  valid:    "bg-emerald-50 text-emerald-600 border border-emerald-200",
  invalid:  "bg-red-50 text-red-600 border border-red-200",
  // Source
  email:    "bg-purple-50 text-purple-600 border border-purple-200",
  manual:   "bg-slate-100 text-slate-500 border border-slate-200",
  upload:   "bg-cyan-50 text-cyan-600 border border-cyan-200",
  api:      "bg-indigo-50 text-indigo-600 border border-indigo-200",
};

export function Badge({ value }: { value: string }) {
  const cls = STYLE_MAP[value] ?? "bg-slate-100 text-slate-500 border border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize tracking-wide whitespace-nowrap ${cls}`}
    >
      {value}
    </span>
  );
}