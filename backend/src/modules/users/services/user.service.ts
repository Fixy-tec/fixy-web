import * as userRepository from "../repositories/user.repository";

export async function getUsers() {
  return userRepository.getUsers();
}

export async function getUserById(id: string) {
  return userRepository.getUserById(id);
}

export async function getCurrentUser(userId: string) {
  return userRepository.getUserWithProfile(userId);
}

export async function updateCurrentUser(userId: string, data: {
  avatarUrl?: string;
  whatsapp?: string;
  bio?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  tags?: string[];
}) {
  return userRepository.updateUserProfile(userId, data);
}
