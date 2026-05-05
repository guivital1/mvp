// src/components/KpiCard.jsx
const COLORS = {
  blue:    "border-blue-500/20 bg-blue-500/5 text-blue-400",
  purple:  "border-purple-500/20 bg-purple-500/5 text-purple-400",
  emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  sky:     "border-sky-500/20 bg-sky-500/5 text-sky-400",
  yellow:  "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  red:     "border-red-500/20 bg-red-500/5 text-red-400",
  orange:  "border-orange-500/20 bg-orange-500/5 text-orange-400",
  gray:    "border-gray-700 bg-gray-800/50 text-gray-400",
};

export default function KpiCard({ label, value, icon, color = "gray", sub }) {
  const cls = COLORS[color] || COLORS.gray;
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${cls}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value ?? "–"}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
