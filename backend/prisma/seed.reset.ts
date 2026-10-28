/**
 * Reinicia los datos de la app para empezar limpio: deja SOLO las cuentas de
 * USERS (Gabriel como admin raíz + 2 usuarios) y borra toda la actividad.
 *
 * Conserva: catálogo de tags, configuración de pagos e historial de migraciones.
 * Uso:  npm run seed:reset -- --yes        (sin --yes solo muestra el destino)
 *
 * ⚠ Borra datos de forma permanente en la base de DATABASE_URL. Saca un
 *   respaldo antes si la base no es desechable.
 */
import { randomBytes } from "crypto";
import { Medal, PlanType, Role } from "@prisma/client";
import prisma from "../src/prisma";
import { hashPassword } from "../src/utils/password";
import { getInstitutionForEmail } from "../src/modules/auth/constants/auth.constants";

const USERS = [
  { email: "gabriel.nunez.a@tecsup.edu.pe", name: "Gabriel", admin: true },
  { email: "carlos_llo@gmail.com", name: "Carlosll", admin: false },
  { email: "lugut02@gmail.com", name: "LuGut", admin: false },
] as const;

function describeTarget(): string {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return `${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "(DATABASE_URL no definida o inválida)";
  }
}

/** Cumple las reglas de registro: letras y números, 8+ caracteres. */
function generatePassword(): string {
  return `Helpy${randomBytes(4).toString("hex")}7`;
}

async function main() {
  console.log(`Base de datos destino: ${describeTarget()}`);
  if (!process.argv.includes("--yes")) {
    console.error("Esto BORRA todos los datos salvo 3 cuentas. Vuelve a correrlo con --yes para confirmar.");
    process.exitCode = 1;
    return;
  }

  // Contraseñas nuevas solo para cuentas que no tengan una (Google se conserva).
  const existing = await prisma.user.findMany({
    where: { email: { in: USERS.map((u) => u.email) } },
    select: { email: true, password: true },
  });
  const plain = new Map<string, string>();
  const hashed = new Map<string, string>();
  for (const u of USERS) {
    const current = existing.find((e) => e.email === u.email);
    if (!current?.password) {
      const pwd = generatePassword();
      plain.set(u.email, pwd);
      hashed.set(u.email, await hashPassword(pwd));
    }
  }

  const keepEmails = USERS.map((u) => u.email);

  await prisma.$transaction(
    async (tx) => {
      // Actividad (orden según llaves foráneas)
      await tx.payment.deleteMany();
      await tx.pointLog.deleteMany();
      await tx.rating.deleteMany();
      await tx.application.deleteMany();
      await tx.requestTag.deleteMany();
      await tx.request.deleteMany();
      await tx.notificationRecipient.deleteMany();
      await tx.notification.deleteMany();
      await tx.adminLog.deleteMany();
      await tx.investment.deleteMany();

      // Usuarios que no están en la lista
      const keepIds = (
        await tx.user.findMany({ where: { email: { in: keepEmails } }, select: { id: true } })
      ).map((u) => u.id);
      const others = { userId: { notIn: keepIds } };
      await tx.userTag.deleteMany({ where: others });
      await tx.deviceToken.deleteMany({ where: others });
      await tx.profile.deleteMany({ where: others });
      await tx.user.deleteMany({ where: { email: { notIn: keepEmails } } });

      // Las 3 cuentas, limpias
      for (const u of USERS) {
        const data = {
          name: u.name,
          role: u.admin ? Role.ADMIN : Role.USER,
          isRootAdmin: u.admin,
          isActive: true,
          points: 0,
          medal: Medal.HIERRO,
          plan: PlanType.FREE,
          planExpiresAt: null,
          ...(hashed.has(u.email) ? { password: hashed.get(u.email) } : {}),
        };
        await tx.user.upsert({
          where: { email: u.email },
          update: data,
          create: {
            ...data,
            email: u.email,
            institution: getInstitutionForEmail(u.email),
            // Sin perfil inventado: cada uno completa su onboarding al entrar.
            profileCompleted: false,
          },
        });
      }
      await tx.profile.updateMany({ data: { avgRating: 0, profileViews: 0 } });
    },
    { timeout: 60_000 },
  );

  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    select: { email: true, name: true, role: true, isRootAdmin: true, profileCompleted: true },
  });
  console.log("\nUsuarios en la base:");
  console.table(users);

  if (plain.size > 0) {
    console.log("Contraseñas nuevas (guárdalas: no se vuelven a mostrar):");
    console.table([...plain].map(([email, password]) => ({ email, password })));
  }
  console.log("Listo. Las cuentas que ya usaban Google siguen entrando con Google.");
}

main()
  .catch((error) => {
    console.error("El reinicio falló y se revirtió completo:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
