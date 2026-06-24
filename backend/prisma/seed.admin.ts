import prisma from "../src/prisma";
import { Role } from "@prisma/client";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME ?? "Administrador Fixy";

  if (!email) {
    console.error("❌ Define ADMIN_EMAIL en el entorno antes de ejecutar el seeder.");
    process.exit(1);
  }

  if (!email.toLowerCase().endsWith("@tecsup.edu.pe")) {
    console.error("❌ ADMIN_EMAIL debe ser un correo @tecsup.edu.pe para login con Google.");
    process.exit(1);
  }

  console.log("🌱 Iniciando seeder de administrador padre...");

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== Role.ADMIN || !existing.isRootAdmin) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: Role.ADMIN,
            isRootAdmin: true,
            isActive: true,
            institution: "TECSUP",
          },
        });
        console.log(`✅ Usuario existente promovido a admin padre: ${email}`);
      } else {
        console.log(`⏭️  Admin padre ya existe: ${email}`);
      }
      return;
    }

    const admin = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        role: Role.ADMIN,
        isRootAdmin: true,
        isActive: true,
        institution: "TECSUP",
        profileCompleted: true,
      },
    });

    console.log(`✅ Admin padre creado: ${admin.email} (id: ${admin.id})`);
    console.log("   Inicia sesión con Google usando ese correo institucional.");
  } catch (error) {
    console.error("❌ Error en seeder de admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
