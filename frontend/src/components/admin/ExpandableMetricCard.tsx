"use client";

import { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

interface MetricRow {
  label: string;
  value: number | string;
  highlight?: boolean;
}

interface ExpandableMetricCardProps {
  title: string;
  mainLabel: string;
  mainValue: number | string;
  icon?: LucideIcon;
  accent?: "teal" | "blue";
  metrics: MetricRow[];
  loading?: boolean;
  expandLabel?: string;
}

const ACCENTS = {
  teal: {
    bg: "bg-[#effaf8]",
    text: "text-[#057f78]",
    border: "border-[#057f78]/15",
    btn: "text-[#057f78] hover:bg-[#effaf8]",
  },
  blue: {
    bg: "bg-[#eff4ff]",
    text: "text-[#1a4ca3]",
    border: "border-[#1a4ca3]/15",
    btn: "text-[#1a4ca3] hover:bg-[#eff4ff]",
  },
};

export default function ExpandableMetricCard({
  title,
  mainLabel,
  mainValue,
  icon: Icon,
  accent = "blue",
  metrics,
  loading = false,
  expandLabel = "Ver métricas",
}: ExpandableMetricCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = ACCENTS[accent];

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md ${style.border}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {title}
            </p>
            {loading ? (
              <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse mt-2" />
            ) : (
              <>
                <p className={`text-3xl font-bold mt-1 ${style.text}`}>
                  {mainValue}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{mainLabel}</p>
              </>
            )}
          </div>
          {Icon && (
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-1.5 transition-colors ${style.btn}`}
        >
          {expandLabel}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && !loading && (
        <div className={`border-t px-6 py-4 space-y-2 ${style.bg}/50`}>
          {metrics.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between text-sm py-1.5"
            >
              <span className="text-gray-600">{row.label}</span>
              <span
                className={`font-semibold ${
                  row.highlight ? style.text : "text-gray-800"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
