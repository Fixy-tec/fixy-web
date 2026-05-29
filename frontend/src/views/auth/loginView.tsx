"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

const TECSUP_REGEX = /^[a-zA-Z0-9._%+-]+@tecsup\.edu\.pe$/;

const LoginView = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!TECSUP_REGEX.test(form.email.trim()))
      newErrors.email = "Debe ser un correo @tecsup.edu.pe";
    if (!form.password) newErrors.password = "Ingresa tu contraseña";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setApiError("");

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      router.push("/home");
    } catch (error: unknown) {
      setApiError(
        error instanceof Error ? error.message : "Error al iniciar sesión",
      );
    }
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
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-gray-500">
              Correo institucional y contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-xs text-red-700">{apiError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo institucional
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="tunombre@tecsup.edu.pe"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                }`}
                required
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.8} />
                  ) : (
                    <Eye size={16} strokeWidth={1.8} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#057f78] hover:bg-[#05605c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              <LogIn size={16} strokeWidth={2} />
              {isLoading ? "Entrando…" : "Iniciar sesión"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link
              href="/auth/register"
              className="text-[#1a4ca3] font-semibold hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
