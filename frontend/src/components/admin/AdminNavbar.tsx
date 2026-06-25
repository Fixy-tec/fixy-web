"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  LayoutTemplate,
  ChevronLeft,
  User,
  Power,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { fetchCurrentUser } from "@/src/lib/user";
import { isRootAdmin } from "@/src/lib/admin";
import AdminBadge from "@/src/components/admin/AdminBadge";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  { href: "/admin/content", label: "Contenido", icon: LayoutTemplate },
];

function capitalizeName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) return "Admin";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const [rootAdmin, setRootAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("Admin");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    void fetchCurrentUser(token)
      .then((dto) => {
        setRootAdmin(!!dto.isRootAdmin);
        setDisplayName(capitalizeName(dto.name));
      })
      .catch(() => {
        if (user?.name && !user.name.includes("@")) {
          setDisplayName(capitalizeName(user.name));
        }
      });
  }, [token, user?.name]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/admin/dashboard" className="shrink-0">
              <Image
                src="/gaaa.png"
                alt="Fixy"
                width={120}
                height={40}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden sm:block min-w-0">
              <p className="text-[10px] font-semibold text-[#057f78] uppercase tracking-widest">
                Panel Administrativo
              </p>
              <p className="text-sm font-bold text-gray-800 truncate">
                Hola, {displayName} 👋
              </p>
            </div>
            {rootAdmin && (
              <AdminBadge isRoot className="hidden md:inline-flex shrink-0" />
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[#effaf8] text-[#057f78] border border-[#057f78]/20"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/home"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#1a4ca3] hover:bg-[#eff4ff] px-3 py-2 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Volver a Fixy
            </Link>
            <Link
              href={user ? `/users/${user.id}` : "/home"}
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1a4ca3] px-3 py-2 rounded-lg"
            >
              <User className="w-4 h-4" />
              Perfil
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200"
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
              aria-label="Menú admin"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-1">
            <p className="sm:hidden px-3 pb-2 text-sm font-bold text-gray-800">
              Hola, {displayName} 👋
            </p>
            <Link
              href="/home"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#1a4ca3] rounded-lg hover:bg-[#eff4ff]"
              onClick={() => setMenuOpen(false)}
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a Fixy
            </Link>
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex gap-2 px-3">
              <Link
                href={user ? `/users/${user.id}` : "/home"}
                className="flex-1 text-center py-2 text-sm rounded-xl bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Perfil
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex-1 py-2 text-sm rounded-xl bg-red-50 text-red-600"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
