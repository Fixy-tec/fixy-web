import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6";

const footerLinks = [
  {
    title: "Plataforma",
    links: [
      { label: "Nosotros", href: "/aboutUs" },
      { label: "Equipo", href: "/equipo" },
      { label: "Blog", href: "/blog" },
      { label: "Casos de éxito", href: "/casos" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contribuir", href: "/contribuir" },
      { label: "Contáctanos", href: "/contacto" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Ranking", href: "/ranking" },
      { label: "Buscar asesorías", href: "/buscar" },
      { label: "Publicar solicitud", href: "/solicitudes/nueva" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
    ],
  },
];

const socials = [
  { icon: <FaGithub size={18} />, href: "https://github.com", label: "GitHub" },
  {
    icon: <FaInstagram size={18} />,
    href: "https://instagram.com",
    label: "Instagram",
  },
  {
    icon: <FaLinkedin size={18} />,
    href: "https://linkedin.com",
    label: "LinkedIn",
  },
  {
    icon: <FaXTwitter size={18} />,
    href: "https://twitter.com",
    label: "Twitter",
  },
];
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-10 md:gap-20">
          {/* Izquierda — logo + descripción + redes */}
          <div className="flex-shrink-0 max-w-xs">
            <Link href="/">
              <Image
                src="/gaaa.png"
                alt="Fixy Logo"
                width={130}
                height={48}
                className="object-contain h-10 w-auto mb-4"
                priority
              />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Plataforma académica para conectar estudiantes mediante asesorías
              y proyectos dentro de su institución.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-gray-400 hover:text-[#1a4ca3] transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Derecha — columnas de links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
            {footerLinks.map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-gray-500 hover:text-[#1a4ca3] transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Fixy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
