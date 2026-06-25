interface AdminBadgeProps {
  isRoot?: boolean;
  className?: string;
}

export default function AdminBadge({ isRoot = false, className = "" }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isRoot
          ? "bg-[#eff4ff] text-[#1a4ca3] border-[#1a4ca3]/25"
          : "bg-[#effaf8] text-[#057f78] border-[#057f78]/25"
      } ${className}`}
    >
      <span aria-hidden>🛡</span>
      {isRoot ? "Admin Principal" : "Admin"}
    </span>
  );
}
