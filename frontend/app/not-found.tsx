import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fdfefe] flex flex-col items-center justify-center px-4 text-center">
      <Image
        src="/fixoMina.png"
        alt="Fixo"
        width={320}
        height={320}
        className="object-contain mb-6 opacity-90"
      />
      <h1 className="text-8xl font-bold mb-2" style={{ color: "#1a4ca3" }}>
        404
      </h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        Página no encontrada
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mb-8">
        La ruta que buscas no existe o fue movida. Verifica la URL e intenta de
        nuevo.
      </p>
      <Link
        href="/"
        className="bg-[#1a4ca3] hover:bg-[#143d87] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
