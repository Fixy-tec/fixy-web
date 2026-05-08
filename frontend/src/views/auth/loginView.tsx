"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

const LoginView = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form);
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-4xl">
        {/* Imagen — mismo porte que el form */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <Image
            src="/fixo_wall_hii.png"
            alt="Fixy wall"
            width={600}
            height={600}
            className="object-contain w-full max-w-lg"
          />
        </div>

        {/* Formulario */}
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 flex-1">
          {/* Logo + título */}
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
              Ingresa tus datos para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Tu nombre de usuario"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#1a4ca3] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30 focus:border-[#1a4ca3] transition-colors"
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
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#057f78] hover:bg-[#05605c] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              <LogIn size={16} strokeWidth={2} />
              Iniciar sesión
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
