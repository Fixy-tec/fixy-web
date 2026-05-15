import * as tagRepository from "../repositories/tag.repository";

export async function getTags() {
  return tagRepository.getTags();
}

export async function getTagById(id: string) {
  return tagRepository.getTagById(id);
}

export async function getTagByName(name: string) {
  return tagRepository.getTagByName(name);
}

export async function createTag(name: string, isCustom: boolean = false) {
  return tagRepository.createTag(name, isCustom);
}

export async function createTags(
  tags: Array<{ name: string; isCustom?: boolean }>,
) {
  return tagRepository.createTags(tags);
}

export async function deleteTag(id: string) {
  return tagRepository.deleteTag(id);
}
