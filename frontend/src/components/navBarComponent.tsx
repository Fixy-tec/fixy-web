"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Power, User } from "lucide-react";

// Cambia esto a true para probar el estado logueado
const IS_LOGGED_IN = true;

const navLinks = [
  { href: "/home", label: "Inicio" },
  { href: "/applications", label: "Mis Solicitudes" },
  { href: "/buscar", label: "Buscar" },
  { href: "/ranking", label: "Ranking" },
];

export default function NavBarComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo — siempre a la izquierda */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/gaaa.png"
              alt="Fixy Logo"
              width={130}
              height={48}
              className="object-contain h-10 w-auto"
              priority
            />
          </Link>

          {/* Centro — solo si está logueado */}
          {IS_LOGGED_IN && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-gray-600 hover:text-[#1a4ca3] font-medium px-4 py-2 rounded-lg transition-all duration-150 text-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Derecha — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {IS_LOGGED_IN ? (
              <>
                {/* Perfil */}
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 text-gray-600 hover:text-[#1a4ca3] font-medium px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  <User size={17} strokeWidth={1.8} />
                  Perfil
                </Link>

                {/* Logout */}
                <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 font-medium px-3 py-2 rounded-lg transition-colors text-sm border border-gray-200 hover:border-red-200">
                  <Power size={16} strokeWidth={1.8} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                {/* Iniciar sesión */}
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-[#057f78] font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Iniciar sesión
                </Link>

                {/* Crear cuenta */}
                <Link
                  href="/auth/register"
                  className="text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  style={{ background: "#1a4ca3" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#143d87")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#1a4ca3")
                  }
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-600 hover:text-[#1a4ca3] p-2 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {IS_LOGGED_IN ? (
              <>
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block py-2 px-3 text-gray-700 hover:text-[#1a4ca3] hover:bg-blue-50 font-medium rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <Link
                    href="/perfil"
                    className="flex items-center gap-2 py-2 px-3 text-gray-700 hover:text-[#1a4ca3] hover:bg-blue-50 font-medium rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} strokeWidth={1.8} />
                    Perfil
                  </Link>
                  <button className="w-full flex items-center gap-2 py-2 px-3 text-red-500 hover:bg-red-50 font-medium rounded-lg transition-colors">
                    <Power size={16} strokeWidth={1.8} />
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block text-center text-gray-700 font-semibold  transition-colors hover:text-[#057f78]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block text-center text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    style={{ background: "#1a4ca3" }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Crear cuenta
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
