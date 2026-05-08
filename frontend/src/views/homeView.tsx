"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  FilePlus2,
  Users,
  CheckCircle2,
  Star,
  BookOpen,
  Rocket,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import Footer from "../components/footerComponent";

const phrases = ["Mejora Académica", "Próximo Proyecto"];
const colors = ["#1a4ca3", "#057f78"];

const steps = [
  {
    icon: <FilePlus2 size={36} strokeWidth={1.5} />,
    title: "Publica tu solicitud",
    desc: "Crea una solicitud de asesoría o búsqueda de socio para tu proyecto. Define el tema, nivel de dificultad, tags y fecha límite.",
    color: "#1a4ca3",
    bg: "#eff4ff",
    number: "01",
  },
  {
    icon: <Users size={36} strokeWidth={1.5} />,
    title: "Recibe postulaciones",
    desc: "Otros estudiantes de tu institución se postulan con su perfil, medalla, calificación promedio y un mensaje de presentación.",
    color: "#057f78",
    bg: "#effaf8",
    number: "02",
  },
  {
    icon: <CheckCircle2 size={36} strokeWidth={1.5} />,
    title: "Elige y conecta",
    desc: "Aprueba al postulante que prefieras. Al aceptarlo, se desbloquea automáticamente su número de WhatsApp para coordinar directamente.",
    color: "#1a4ca3",
    bg: "#eff4ff",
    number: "03",
  },
  {
    icon: <Star size={36} strokeWidth={1.5} />,
    title: "Califica y sube de rango",
    desc: "Al completar, ambos se califican mutuamente. Gana puntos según el nivel y la calificación recibida, y sube de Hierro hasta Challenger.",
    color: "#057f78",
    bg: "#effaf8",
    number: "04",
  },
];

function TimelineStep({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className="relative grid grid-cols-[1fr_auto_1fr] gap-x-6 md:gap-x-10 items-center mb-16 last:mb-0"
    >
      {/* Lado izquierdo */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={isLeft ? "flex justify-end" : ""}
      >
        {isLeft ? (
          <div className="max-w-xs rounded-2xl p-6 shadow-sm border border-gray-100 bg-white">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: step.bg, color: step.color }}
            >
              {step.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
          </div>
        ) : (
          <div /> // espacio vacío
        )}
      </motion.div>

      {/* Centro — nodo + línea */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 shadow-md"
          style={{ background: step.color }}
        >
          {step.number}
        </motion.div>
        {index < steps.length - 1 && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-0.5 mt-2"
            style={{
              height: "5rem",
              background: `linear-gradient(to bottom, ${step.color}, ${steps[index + 1].color})`,
              transformOrigin: "top",
            }}
          />
        )}
      </div>

      {/* Lado derecho */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {!isLeft ? (
          <div className="max-w-xs rounded-2xl p-6 shadow-sm border border-gray-100 bg-white">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: step.bg, color: step.color }}
            >
              {step.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
          </div>
        ) : (
          <div /> // espacio vacío
        )}
      </motion.div>
    </div>
  );
}

export default function HomeView() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % phrases.length);
        setVisible(true);
      }, 300);
    }, 3300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-medium text-gray-700 mb-4 max-w-3xl">
          Tu{" "}
          <span
            style={{
              color: colors[current],
              transition: "opacity 0.3s ease",
              opacity: visible ? 1 : 0,
              display: "inline-block",
            }}
          >
            {phrases[current]}
          </span>{" "}
          Comienza Aquí
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          Conecta con tutores académicos, busca compañeros para proyectos y
          recibe asesoría personalizada dentro de tu institución.
        </p>
        <button className="border border-gray-300 hover:border-gray-500 text-gray-600 font-semibold py-3 px-8 rounded-lg transition-colors">
          Como Funciona
        </button>
      </div>

      {/* Banner */}
      <div className="w-full">
        <Image
          src="/banerFixy3.png"
          alt="Banner Fixy"
          width={1920}
          height={1080}
          sizes="100vw"
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Cómo funciona */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              En cuatro pasos conecta con la comunidad académica de tu
              institución, colabora y construye tu reputación.
            </p>
          </div>

          {/* Tipos de solicitud */}
          <div className="my-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BookOpen size={18} color="#1a4ca3" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-gray-800">Asesorías</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                ¿Necesitas ayuda con un curso, revisión de trabajo o repaso
                antes de un examen? Publica una solicitud y recibe postulaciones
                de compañeros que dominan el tema.
              </p>
            </div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Rocket size={18} color="#057f78" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-gray-800">Proyectos</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                ¿Tienes una idea y necesitas socios? Publica tu proyecto, define
                las habilidades que buscas y encuentra compañeros para
                desarrollarlo juntos, con o sin beneficio económico.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="py-4">
            {steps.map((step, i) => (
              <TimelineStep key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
          {/* Imagen */}
          <div className="shrink-0">
            <Image
              src="/fixo.png"
              alt="Fixo mascota"
              width={280}
              height={280}
              className="object-contain"
            />
          </div>

          {/* Texto */}
          <div className="text-center md:text-left max-w-sm">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
              ¿Quieres contactarnos?
            </h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Conéctate con nuestra comunidad en discord, resuelve tus dudas,
              danos feedback o{" "}
              <a
                href="mailto:contacto@fixy.pe"
                className="underline text-gray-600 hover:text-[#1a4ca3] transition-colors"
              >
                envíanos un correo
              </a>
              . Estamos aquí para ayudarte.
            </p>
            <a
              href="https://wa.me/51999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Unete a nuestro Discord
            </a>
          </div>
        </div>

        {/* Contribuir */}
        <div className="max-w-xl mx-auto text-center mt-20">
          <p className="text-gray-500 leading-relaxed mb-6">
            Si quieres apoyar a la comunidad académica, puedes hacerlo
            compartiendo la plataforma o sinedo parte de ella como usuario
            activo.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              className="text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              style={{ background: "#1a4ca3" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#143d87")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1a4ca3")
              }
            >
              Crear Cuenta
            </button>
            <button
              className="text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              style={{ background: "#057f78" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#046860")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#057f78")
              }
            >
              Compartir Fixy
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
