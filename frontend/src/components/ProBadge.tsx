import { Crown } from "lucide-react";

interface ProBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

/** Insignia del plan Pro (perfil, ranking, navbar). */
export default function ProBadge({ size = "sm", className = "" }: ProBadgeProps) {
  const sizing =
    size === "md" ? "text-xs px-2.5 py-1 gap-1" : "text-[10px] px-1.5 py-0.5 gap-0.5";
  const icon = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm ${sizing} ${className}`}
      title="Usuario Pro"
    >
      <Crown className={icon} />
      Pro
    </span>
  );
}
