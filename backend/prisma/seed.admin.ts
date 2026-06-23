import prisma from "../src/prisma";
import { Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";


async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrador Fixy";

  if (!email || !password) {
    console.error(
      "❌ Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno antes de ejecutar el seeder.",
    );
    process.exit(1);
  }

  console.log("🌱 Iniciando seeder de administrador padre...");

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== Role.ADMIN || !existing.isRootAdmin) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: Role.ADMIN, isRootAdmin: true, isActive: true },
        });
        console.log(`✅ Usuario existente promovido a admin padre: ${email}`);
      } else {
        console.log(`⏭️  Admin padre ya existe: ${email}`);
      }
      return;
    }

    const hashedPassword = await hashPassword(password);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.ADMIN,
        isRootAdmin: true,
        isActive: true,
      },
    });

    console.log(`✅ Admin padre creado: ${admin.email} (id: ${admin.id})`);
  } catch (error) {
    console.error("❌ Error en seeder de admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
