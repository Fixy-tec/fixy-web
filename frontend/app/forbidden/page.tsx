import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import ForbiddenRedirect from "@/src/components/forbiddenRedirect";

export default function ForbiddenPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
          </div>
        }
      >
        <ForbiddenRedirect />
      </Suspense>
      <div className="min-h-screen bg-[#fdfefe] flex flex-col items-center justify-center px-4 text-center">
        <Image
          src="/fixoClub.png"
          alt="Fixo"
          width={320}
          height={320}
          className="object-contain mb-6 opacity-90"
        />
        <h1 className="text-8xl font-bold mb-2" style={{ color: "#1a4ca3" }}>
          403
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Acceso restringido
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mb-8">
          Necesitas iniciar sesión para acceder a esta página. Si ya tienes
          cuenta, ingresa con tus credenciales.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/auth/login"
            className="bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/"
            className="border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </>
  );
}
