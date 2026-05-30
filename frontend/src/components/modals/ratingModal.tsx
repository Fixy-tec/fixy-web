"use client";

import { useEffect, useState } from "react";
import { Loader2, Star, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  /** Texto descriptivo bajo el título */
  subtitle?: string;
  /** Nombre de quien estás calificando, se muestra en negrita */
  targetName?: string;
  onClose: () => void;
  /**
   * Callback al confirmar. Si la promesa lanza error se muestra debajo del
   * formulario y el modal queda abierto.
   */
  onSubmit: (stars: number, comment?: string) => Promise<void>;
  isSubmitting?: boolean;
  /** Para mostrar errores que vengan de afuera (ej. del context) */
  externalError?: string | null;
}

const STARS = [1, 2, 3, 4, 5] as const;

const STAR_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

export default function RatingModal({
  open,
  title,
  subtitle,
  targetName,
  onClose,
  onSubmit,
  isSubmitting = false,
  externalError = null,
}: Props) {
  const [stars, setStars] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStars(0);
      setHovered(0);
      setComment("");
      setLocalError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setLocalError(null);
    if (stars < 1 || stars > 5) {
      setLocalError("Selecciona una calificación de 1 a 5 estrellas");
      return;
    }
    try {
      await onSubmit(stars, comment.trim() || undefined);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "No se pudo enviar la calificación",
      );
    }
  };

  const errorMessage = localError ?? externalError;
  const displayStars = hovered || stars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {subtitle}
                {targetName && (
                  <>
                    {" "}
                    <span className="font-medium text-gray-700">
                      {targetName}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Estrellas */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            {STARS.map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setStars(n)}
                disabled={isSubmitting}
                className="p-1 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
              >
                <Star
                  size={32}
                  strokeWidth={1.5}
                  className={
                    n <= displayStars
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 h-4">
            {displayStars > 0 ? STAR_LABELS[displayStars] : ""}
          </p>
        </div>

        {/* Comentario */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Comentario{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            placeholder="Cuéntale a la otra persona cómo fue la experiencia…"
            maxLength={1000}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#057f78]/30 focus:border-[#057f78] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-[11px] text-gray-400 text-right">
            {comment.length}/1000
          </p>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 mb-3">{errorMessage}</p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || stars < 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#057f78] hover:bg-[#046860] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Star size={14} />
            )}
            {isSubmitting ? "Enviando…" : "Enviar calificación"}
          </button>
        </div>
      </div>
    </div>
  );
}
