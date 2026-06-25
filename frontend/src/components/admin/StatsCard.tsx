import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: "teal" | "blue" | "green" | "gray";
  loading?: boolean;
}

const ACCENTS = {
  teal: { bg: "bg-[#effaf8]", text: "text-[#057f78]", border: "border-[#057f78]/15" },
  blue: { bg: "bg-[#eff4ff]", text: "text-[#1a4ca3]", border: "border-[#1a4ca3]/15" },
  green: { bg: "bg-green-50", text: "text-[#009c70]", border: "border-green-100" },
  gray: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" },
};

export default function StatsCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = "blue",
  loading = false,
}: StatsCardProps) {
  const style = ACCENTS[accent];

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm bg-white hover:shadow-md transition-shadow ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mt-2" />
          ) : (
            <p className={`text-2xl font-bold mt-1 ${style.text}`}>{value}</p>
          )}
          {sublabel && (
            <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
