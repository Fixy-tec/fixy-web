"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { registerWithPassword, saveToken } from "@/src/lib/auth";
import { PROFILE_RULES } from "@/src/lib/user";
import { AuthDivider, GoogleButton } from "@/src/views/auth/loginView";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: { name: string; email: string; password: string; confirm: string }) {
  const name = input.name.trim();
  if (name.length < PROFILE_RULES.NAME_MIN || name.length > PROFILE_RULES.NAME_MAX) {
    return `El nombre de usuario debe tener entre ${PROFILE_RULES.NAME_MIN} y ${PROFILE_RULES.NAME_MAX} letras`;
  }
  if (!PROFILE_RULES.NAME_REGEX.test(name)) {
    return "El nombre de usuario solo puede tener letras (sin espacios)";
  }
  if (!EMAIL_REGEX.test(input.email.trim())) return "Ingresa un correo válido";
  if (input.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) {
    return "La contraseña debe combinar letras y números";
  }
  if (input.password !== input.confirm) return "Las contraseñas no coinciden";
  return null;
}

export default function RegisterView() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const passwordChecks = [
    { ok: form.password.length >= 8, label: "8+ caracteres" },
    { ok: /[A-Za-z]/.test(form.password) && /\d/.test(form.password), label: "Letras y números" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validate(form);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { accessToken } = await registerWithPassword({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      saveToken(accessToken);
      // El AuthContext redirige al onboarding porque el perfil está incompleto.
      window.location.href = "/auth/on-boarding";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
      setSubmitting(false);
    }
  };

  const input =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4ca3]/30";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefefe] px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">
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
          <h1 className="text-2xl font-semibold text-gray-700 mb-1">Crea tu cuenta</h1>
          <p className="text-sm text-gray-500">Gratis, con cualquier correo</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Nombre de usuario
            </label>
            <input
              autoComplete="username"
              value={form.name}
              onChange={set("name")}
              placeholder="Solo letras, sin espacios"
              maxLength={PROFILE_RULES.NAME_MAX}
              className={input}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo</label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder="tucorreo@gmail.com"
              className={input}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                className={`${input} pr-10`}
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
            <div className="flex gap-3 mt-1.5">
              {passwordChecks.map((c) => (
                <span
                  key={c.label}
                  className={`flex items-center gap-1 text-[11px] ${c.ok ? "text-emerald-600" : "text-gray-400"}`}
                >
                  <Check className="w-3 h-3" />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Repite la contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirm}
              onChange={set("confirm")}
              className={input}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-70"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear cuenta
          </button>
        </form>

        <AuthDivider />
        <GoogleButton label="Registrarme con Google" />

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="font-semibold text-[#1a4ca3] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
