"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getGoogleLoginUrl, loginWithPassword, saveToken } from "@/src/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Cancelaste el inicio de sesión con Google.",
  missing_code: "No se recibió el código de autorización.",
  network_error: "Error de conexión. Intenta de nuevo.",
  session_invalid: "No se pudo validar la sesión. Intenta de nuevo.",
  missing_token: "No se encontró el token de sesión.",
};

export function GoogleButton({ label = "Continuar con Google" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = getGoogleLoginUrl();
      }}
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
      {label}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400">o</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const oauthError = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? decodeURIComponent(errorKey).slice(0, 200))
    : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña");
      return;
    }
    setSubmitting(true);
    try {
      const { accessToken } = await loginWithPassword({ email: email.trim(), password });
      saveToken(accessToken);
      // Recarga completa: el AuthContext y el middleware leen la sesión nueva.
      window.location.href = "/home";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4 py-10">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-4xl">
        <div className="hidden lg:flex items-center justify-center flex-1">
          <Image
            src="/fixo_wall_hii.png"
            alt="Helpy wall"
            width={600}
            height={600}
            className="object-contain w-full max-w-lg"
          />
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 flex-1">
          <div className="mb-7 text-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Helpy Logo"
                width={148}
                height={48}
                className="object-contain h-10 w-auto mb-6 mx-auto"
                priority
              />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-700 mb-1">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
          </div>

          {(error || oauthError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs text-red-700">{error ?? oauthError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Correo
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-70"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Iniciar sesión
            </button>
          </form>

          <AuthDivider />
          <GoogleButton />

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="font-semibold text-[#1a4ca3] hover:underline">
              Regístrate gratis
            </Link>
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
