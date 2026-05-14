"use client";

import { MedalsProvider } from "@/src/context/MedalsContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <MedalsProvider>{children}</MedalsProvider>;
}
