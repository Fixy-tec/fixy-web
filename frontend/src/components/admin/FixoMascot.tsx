import Image from "next/image";
import { FIXO_ASSETS, type FixoVariant } from "@/src/lib/fixoAssets";

interface FixoMascotProps {
  variant?: FixoVariant;
  size?: number;
  className?: string;
}

export default function FixoMascot({
  variant = "arte",
  size = 100,
  className = "",
}: FixoMascotProps) {
  return (
    <Image
      src={FIXO_ASSETS[variant]}
      alt="Fixo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
