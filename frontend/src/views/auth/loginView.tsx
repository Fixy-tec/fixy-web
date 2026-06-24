"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getGoogleLoginUrl } from "@/src/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  institutional_email:
    "Fixy actualmente solo está disponible para estudiantes de TECSUP.",
  google_denied: "Cancelaste el inicio de sesión con Google.",
  missing_code: "No se recibió el código de autorización.",
  network_error: "Error de conexión. Intenta de nuevo.",
  session_invalid: "No se pudo validar la sesión. Intenta de nuevo.",
  missing_token: "No se encontró el token de sesión.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const apiError = errorKey
    ? (ERROR_MESSAGES[errorKey] ??
      decodeURIComponent(errorKey).slice(0, 200))
    : "";

  const handleGoogleLogin = () => {
    window.location.href = getGoogleLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-4xl">
        <div className="hidden lg:flex items-center justify-center flex-1">
          <Image
            src="/fixo_wall_hii.png"
            alt="Fixy wall"
            width={600}
            height={600}
            className="object-contain w-full max-w-lg"
          />
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 flex-1">
          <div className="mb-8 text-center">
            <Link href="/">
              <Image
                src="/gaaa.png"
                alt="Fixy Logo"
                width={130}
                height={48}
                className="object-contain h-10 w-auto mb-6 mx-auto"
                priority
              />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-700 mb-1">
              Bienvenido a Fixy
            </h1>
            <p className="text-sm text-gray-500">
              Inicia sesión con tu correo institucional @tecsup.edu.pe
            </p>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs text-red-700">{apiError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            Solo estudiantes con correo{" "}
            <span className="font-medium text-gray-500">@tecsup.edu.pe</span>{" "}
            pueden acceder.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginView() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
