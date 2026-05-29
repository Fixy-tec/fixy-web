import prisma from "../src/prisma";

const TAGS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "Django",
  "Java",
  "Spring Boot",
  "SQL",
  "MongoDB",
  "AWS",
  "Linux",
  "Docker",
  "Flutter",
  "Dart",
  "Swift",
  "Kotlin",
  "Arduino",
  "IoT",
  "Git",
];

async function seedTags() {
  console.log("🌱 Iniciando seeder de tags...");

  try {
    for (const tagName of TAGS) {
      const existingTag = await prisma.tag.findUnique({
        where: { name: tagName },
      });

      if (!existingTag) {
        const newTag = await prisma.tag.create({
          data: {
            name: tagName,
            isCustom: false,
          },
        });
        console.log(`✅ Tag creado: ${newTag.name}`);
      } else {
        console.log(`⏭️  Tag ya existe: ${tagName}`);
      }
    }

    console.log("✨ Seeder de tags completado");
  } catch (error) {
    console.error("❌ Error en seeder de tags:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTags();
