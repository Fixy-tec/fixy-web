"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import {
  getHomePublication,
  getHomeSteps,
  updateHomeContent,
  type HomePublication,
  type HomeStep,
} from "@/src/lib/homeContent";
import ContentEditor from "@/src/components/admin/ContentEditor";
import { useToast } from "@/src/context/ToastContext";

export default function AdminContentView() {
  const { showToast } = useToast();
  const [publication, setPublication] = useState<HomePublication | null>(null);
  const [steps, setSteps] = useState<HomeStep[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPublication(getHomePublication());
    setSteps(getHomeSteps());
  }, []);

  const handleSave = () => {
    if (!publication) return;
    setSaving(true);
    try {
      updateHomeContent({ publication, steps });
      showToast("Contenido guardado. Recarga la home para ver cambios.", "success");
    } finally {
      setSaving(false);
    }
  };

  if (!publication) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contenido Home</h2>
          <p className="text-sm text-gray-500 mt-1">
            Edita la card de publicaciones y los pasos de la landing.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#057f78] hover:bg-[#046860] text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar cambios
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <ContentEditor
          publication={publication}
          steps={steps}
          onPublicationChange={setPublication}
          onStepsChange={setSteps}
        />
      </div>
    </div>
  );
}
