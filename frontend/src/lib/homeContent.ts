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

/** Contenido fijo de la página de inicio, compartido por todos los visitantes. */
export const HOME_PUBLICATION: HomePublication = {
  image: "/fixoNews.png",
  title: "El servidor de Minecraft de Helpy está en camino",
  description:
    "Estamos preparando un espacio para reuniones, eventos, actividades y colaboración entre estudiantes dentro de Minecraft.",
  buttonLabel: "Próximamente",
  buttonUrl: "#",
  active: true,
  badge: "Noticias",
};

export const HOME_STEPS: HomeStep[] = [
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
