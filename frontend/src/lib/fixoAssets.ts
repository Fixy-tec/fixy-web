/** Rutas canónicas de mascota Fixo en `public/`. */
export const FIXO_ASSETS = {
  default: "/fixo.png",
  club: "/fixoClub.png",
  arte: "/avatars/fixoArte.png",
  money: "/avatars/fixoMoney.png",
  hacker: "/avatars/fixoHacker.png",
  pirata: "/avatars/fixoPirata.png",
  karate: "/avatars/fixoKarate.png",
} as const;

export type FixoVariant = keyof typeof FIXO_ASSETS;
