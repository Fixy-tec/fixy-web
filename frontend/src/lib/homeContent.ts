const PUBLICATION_KEY = "fixy_home_publication";
const STEPS_KEY = "fixy_home_steps";

export interface HomePublication {
  image: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
  badge?: string;
}

export interface HomeStep {
  id: string;
  image?: string;
  title: string;
  description: string;
  color: string;
  bg: string;
  number: string;
  extraImages?: string[];
}

export interface HomeContent {
  publication: HomePublication;
  steps: HomeStep[];
}

const DEFAULT_PUBLICATION: HomePublication = {
  image: "/fixoNews.png",
  title: "El servidor de Minecraft de Fixy está en camino",
  description:
    "Estamos preparando un espacio para reuniones, eventos, actividades y colaboración entre estudiantes dentro de Minecraft.",
  buttonLabel: "Próximamente",
  buttonUrl: "#",
  active: true,
  badge: "Noticias",
};

const DEFAULT_STEPS: HomeStep[] = [
  {
    id: "1",
    title: "Publica tu solicitud",
    description:
      "Crea una solicitud de asesoría o búsqueda de socio para tu proyecto. Define el tema, nivel de dificultad, tags y fecha límite.",
    color: "#1a4ca3",
    bg: "#eff4ff",
    number: "01",
  },
  {
    id: "2",
    title: "Recibe postulaciones",
    description:
      "Otros estudiantes de tu institución se postulan con su perfil, medalla, calificación promedio y un mensaje de presentación.",
    color: "#057f78",
    bg: "#effaf8",
    number: "02",
  },
  {
    id: "3",
    title: "Elige y conecta",
    description:
      "Aprueba al postulante que prefieras. Al aceptarlo, se desbloquea automáticamente su número de WhatsApp para coordinar directamente.",
    color: "#1a4ca3",
    bg: "#eff4ff",
    number: "03",
  },
  {
    id: "4",
    title: "Califica y sube de rango",
    description:
      "Al completar, ambos se califican mutuamente. Gana puntos según el nivel y la calificación recibida, y sube de Hierro hasta Challenger.",
    color: "#057f78",
    bg: "#effaf8",
    number: "04",
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getHomePublication(): HomePublication {
  return readJson(PUBLICATION_KEY, DEFAULT_PUBLICATION);
}

export function saveHomePublication(publication: HomePublication): void {
  writeJson(PUBLICATION_KEY, publication);
}

export function getHomeSteps(): HomeStep[] {
  return readJson(STEPS_KEY, DEFAULT_STEPS);
}

export function saveHomeSteps(steps: HomeStep[]): void {
  writeJson(STEPS_KEY, steps);
}

export function updateHomeContent(content: Partial<HomeContent>): HomeContent {
  const publication = content.publication
    ? { ...getHomePublication(), ...content.publication }
    : getHomePublication();
  const steps = content.steps ? content.steps : getHomeSteps();

  saveHomePublication(publication);
  saveHomeSteps(steps);

  return { publication, steps };
}

export function getDefaultHomeContent(): HomeContent {
  return {
    publication: DEFAULT_PUBLICATION,
    steps: DEFAULT_STEPS,
  };
}
