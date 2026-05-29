"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

const TECSUP_REGEX = /^[a-zA-Z0-9._%+-]+@tecsup\.edu\.pe$/;

const RegisterView = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.name.trim().length < 3)
      newErrors.name = "Ingresa tu nombre completo";
    if (!TECSUP_REGEX.test(form.email))
      newErrors.email = "Debe ser un correo @tecsup.edu.pe";
    if (form.password.length < 8) newErrors.password = "Mínimo 8 caracteres";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";
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
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      router.replace("/auth/on-boarding");
    } catch (error: any) {
      setApiError(error.message || "Error al registrarse");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-4xl">
        {/* Imagen */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <Image
            src="/fixo_wall.png"
            alt="Fixy wall"
            width={600}
            height={600}
            className="object-contain w-full max-w-lg"
          />
        </div>

        {/* Formulario */}
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
              Crea tu cuenta
            </h1>
            <p className="text-sm text-gray-500">
              Solo necesitas tu correo institucional
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error del API */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-xs text-red-700">{apiError}</p>
              </div>
            )}

            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo
              </label>

              <input
                type="text"
                placeholder="Ej. Gabriel Núñez Arenas"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                }`}
                required
              />

              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo institucional
              </label>
              <input
                type="email"
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

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
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

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3]"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff size={16} strokeWidth={1.8} />
                  ) : (
                    <Eye size={16} strokeWidth={1.8} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a4ca3] hover:bg-[#143d87] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              <UserPlus size={16} strokeWidth={2} />
              {isLoading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-[#057f78] font-semibold hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
