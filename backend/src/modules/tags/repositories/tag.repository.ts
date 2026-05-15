import prisma from "../../../prisma";

export async function getTags() {
  return prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function findTagsByNames(names: string[]) {
  if (names.length === 0) return [];
  return prisma.tag.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
}

export async function getTagById(id: string) {
  return prisma.tag.findUnique({
    where: { id },
  });
}

export async function getTagByName(name: string) {
  return prisma.tag.findUnique({
    where: { name },
  });
}

export async function createTag(name: string, isCustom: boolean = false) {
  return prisma.tag.create({
    data: {
      name,
      isCustom,
    },
  });
}

export async function createTags(
  tags: Array<{ name: string; isCustom?: boolean }>,
) {
  const createdTags = [];
  for (const tag of tags) {
    const existingTag = await getTagByName(tag.name);
    if (!existingTag) {
      const newTag = await createTag(tag.name, tag.isCustom || false);
      createdTags.push(newTag);
    } else {
      createdTags.push(existingTag);
    }
  }
  return createdTags;
}

export async function deleteTag(id: string) {
  return prisma.tag.delete({
    where: { id },
  });
}
