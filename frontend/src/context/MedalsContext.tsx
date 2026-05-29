"use client";

import React, { createContext, useContext } from "react";
import {
  MEDALS,
  Medal,
  MedalInfo,
  Student,
  getMedalByPoints,
  getNextMedal,
  calculateMedalProgress,
} from "../lib/medals";

// Reexportar tipos para que vistas solo importen del context
export type { Medal, MedalInfo, Student };

interface MedalsContextType {
  medals: MedalInfo[];
  getMedalByPoints: (points: number) => MedalInfo;
  getNextMedal: (currentMedal: MedalInfo) => MedalInfo | null;
  calculateMedalProgress: (points: number, currentMedal: MedalInfo) => number;
}

const MedalsContext = createContext<MedalsContextType | undefined>(undefined);

export function MedalsProvider({ children }: { children: React.ReactNode }) {
  const value: MedalsContextType = {
    medals: MEDALS,
    getMedalByPoints,
    getNextMedal,
    calculateMedalProgress,
  };

  return (
    <MedalsContext.Provider value={value}>{children}</MedalsContext.Provider>
  );
}

export function useMedals() {
  const context = useContext(MedalsContext);
  if (!context) {
    throw new Error("useMedals debe ser usado dentro de MedalsProvider");
  }
  return context;
}
