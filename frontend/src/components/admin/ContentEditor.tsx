"use client";

import Image from "next/image";
import type { HomePublication, HomeStep } from "@/src/lib/homeContent";

interface ContentEditorProps {
  publication: HomePublication;
  steps: HomeStep[];
  onPublicationChange: (pub: HomePublication) => void;
  onStepsChange: (steps: HomeStep[]) => void;
}

export default function ContentEditor({
  publication,
  steps,
  onPublicationChange,
  onStepsChange,
}: ContentEditorProps) {
  const updateStep = (id: string, patch: Partial<HomeStep>) => {
    onStepsChange(
      steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const addStep = () => {
    const n = String(steps.length + 1).padStart(2, "0");
    onStepsChange([
      ...steps,
      {
        id: `${Date.now()}`,
        title: "Nuevo paso",
        description: "Descripción del paso",
        color: "#057f78",
        bg: "#effaf8",
        number: n,
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">Card de publicaciones (Home)</h3>
        {(
          [
            ["image", "Imagen (URL)"],
            ["title", "Título"],
            ["description", "Descripción"],
            ["buttonLabel", "Texto del botón"],
            ["buttonUrl", "URL del botón"],
            ["badge", "Badge"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
            {key === "description" ? (
              <textarea
                value={publication[key] ?? ""}
                onChange={(e) =>
                  onPublicationChange({ ...publication, [key]: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
              />
            ) : (
              <input
                type="text"
                value={publication[key] ?? ""}
                onChange={(e) =>
                  onPublicationChange({ ...publication, [key]: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
              />
            )}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={publication.active}
            onChange={(e) =>
              onPublicationChange({ ...publication, active: e.target.checked })
            }
            className="rounded border-gray-300 text-[#057f78]"
          />
          Publicación activa
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">Preview</h3>
        <div className="relative overflow-hidden rounded-3xl min-h-64 border border-gray-100 shadow-sm">
          <Image
            src={publication.image || "/fixoNews.png"}
            alt="Preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-0 left-0 w-full backdrop-blur-sm bg-black/30 border-t border-white/10 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-widest opacity-70">
              {publication.badge ?? "Noticias"}
            </p>
            <h4 className="font-bold mt-1">{publication.title}</h4>
            <p className="text-sm opacity-90 mt-1 line-clamp-2">
              {publication.description}
            </p>
            <span className="inline-block mt-3 text-xs bg-white/20 px-3 py-1 rounded-full">
              {publication.buttonLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="xl:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Pasos de Fixy (timeline)</h3>
          <button
            type="button"
            onClick={addStep}
            className="text-sm font-semibold text-[#1a4ca3] hover:underline"
          >
            + Agregar paso
          </button>
        </div>
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl border border-gray-100 bg-white"
            >
              <input
                type="text"
                placeholder="Título"
                value={step.title}
                onChange={(e) => updateStep(step.id, { title: e.target.value })}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Imagen (URL opcional)"
                value={step.image ?? ""}
                onChange={(e) => updateStep(step.id, { image: e.target.value })}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Descripción"
                value={step.description}
                onChange={(e) => updateStep(step.id, { description: e.target.value })}
                rows={2}
                className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Imágenes extra (URLs separadas por coma)"
                value={step.extraImages?.join(", ") ?? ""}
                onChange={(e) =>
                  updateStep(step.id, {
                    extraImages: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
