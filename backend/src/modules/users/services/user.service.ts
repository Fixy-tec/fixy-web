import prisma from "../../../prisma";
import { Prisma } from "@prisma/client";
import * as userRepository from "../repositories/user.repository";
import * as tagRepository from "../../tags/repositories/tag.repository";

function toPublicUser<T extends { password?: string }>(user: T | null) {
  if (!user) return null;
  const { password: _pw, ...rest } = user as T & { password?: string };
  return rest;
}

export async function getUsers() {
  return userRepository.getUsers();
}

export async function getUserById(id: string) {
  const user = await userRepository.getUserById(id);
  const publicUser = toPublicUser(user);
  if (!publicUser) return null;
  return attachUserStats(publicUser);
}

/**
 * Calcula la posición global del usuario en el ranking (1-indexada).
 *
 * Se cuentan los usuarios *activos* con MÁS puntos que el actual y se suma 1.
 * En caso de empate por puntos, todos comparten la misma posición visible
 * (no usamos `createdAt` como desempate para que dos usuarios con 0 pts no
 * tengan posiciones distintas arbitrarias).
 */
export async function getUserRank(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, isActive: true },
  });
  if (!user) return 0;
  // Usuarios inactivos no se rankean
  if (!user.isActive) return 0;

  const above = await prisma.user.count({
    where: {
      isActive: true,
      points: { gt: user.points },
    },
  });
  return above + 1;
}

async function attachUserStats<T extends { id: string }>(user: T) {
  const [completedRequests, rank] = await Promise.all([
    prisma.request.count({
      where: { creatorId: user.id, status: "COMPLETADA" },
    }),
    getUserRank(user.id),
  ]);
  return {
    ...user,
    stats: { completedRequests, rank },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await userRepository.getUserWithProfile(userId);
  const publicUser = toPublicUser(user);
  if (!publicUser) return null;
  return attachUserStats(publicUser);
}

/**
 * Devuelve el top de usuarios para la vista de Ranking.
 *
 * - Solo usuarios activos.
 * - Orden por puntos DESC; desempate por `createdAt` ASC (los más antiguos
 *   con los mismos puntos quedan primero).
 * - Trae `profile` (para avatar/carrera/avgRating) y agrega `completedRequests`
 *   por cada usuario.
 *
 * Por simplicidad agregamos `rank` 1-indexado en base al orden retornado
 * (suficiente para mostrar la posición en el top; el ranking global real se
 * obtiene con `getUserRank()` cuando el usuario consulta su propio perfil).
 */
export async function getUsersRanking(options?: {
  limit?: number;
  medal?: string;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? 100, 200));
  const medalUpper = options?.medal?.toUpperCase();
  const validMedals = [
    "HIERRO",
    "BRONCE",
    "PLATA",
    "ORO",
    "DIAMANTE",
    "MAESTRO",
    "CHALLENGER",
  ];
  const medalFilter =
    medalUpper && validMedals.includes(medalUpper) ? medalUpper : undefined;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(medalFilter ? { medal: medalFilter as any } : {}),
    },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      points: true,
      medal: true,
      createdAt: true,
      profile: {
        select: {
          avatarUrl: true,
          career: true,
          avgRating: true,
        },
      },
    },
  });

  if (users.length === 0) return [];

  // Conteo de solicitudes completadas (como creador) para cada usuario
  // en una sola consulta agrupada.
  const grouped = await prisma.request.groupBy({
    by: ["creatorId"],
    where: {
      creatorId: { in: users.map((u) => u.id) },
      status: "COMPLETADA",
    },
    _count: { _all: true },
  });
  const completedByUser = new Map<string, number>();
  for (const g of grouped) {
    completedByUser.set(g.creatorId, g._count._all);
  }

  // Si NO hay filtro por medalla, `rank` coincide con la posición global.
  // Si SÍ hay filtro, calculamos el rank global de cada usuario en paralelo
  // (limit ≤ 200 → tolerable; podría optimizarse con una ventana SQL).
  let ranks: number[];
  if (!medalFilter) {
    ranks = users.map((_, i) => i + 1);
  } else {
    ranks = await Promise.all(users.map((u) => getUserRank(u.id)));
  }

  return users.map((u, i) => ({
    id: u.id,
    name: u.name,
    points: u.points,
    medal: u.medal,
    rank: ranks[i] ?? i + 1,
    completedRequests: completedByUser.get(u.id) ?? 0,
    profile: u.profile
      ? {
          avatarUrl: u.profile.avatarUrl,
          career: u.profile.career,
          avgRating: u.profile.avgRating,
        }
      : null,
  }));
}

export class InvalidTagNamesError extends Error {
  constructor() {
    super("Uno o más tags no existen en el catálogo");
    this.name = "InvalidTagNamesError";
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Ese nombre de usuario ya está en uso");
    this.name = "UsernameTakenError";
  }
}

export async function updateCurrentUser(userId: string, data: {
  name?: string;
  avatarUrl?: string;
  whatsapp: string;  // Required to match schema validation
  bio?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  tags?: string[];
}) {
  let tagIds: string[] | undefined = undefined;
  if (data.tags !== undefined) {
    const uniqueNames = [
      ...new Set(
        data.tags.map((t) => t.trim()).filter((t) => t.length > 0),
      ),
    ];
    if (uniqueNames.length === 0) {
      tagIds = [];
    } else {
      const found = await tagRepository.findTagsByNames(uniqueNames);
      if (found.length !== uniqueNames.length) {
        throw new InvalidTagNamesError();
      }
      tagIds = found.map((t) => t.id);
    }
  }

  // Si se intenta cambiar el nombre, verificamos duplicados explícitamente
  // (la BD no marca `name` como @unique en User, pero queremos evitar choques).
  if (data.name !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { name: data.name, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw new UsernameTakenError();
  }

  try {
    const updated = await userRepository.updateUserProfile(userId, {
      name: data.name,
      avatarUrl: data.avatarUrl,
      whatsapp: data.whatsapp,
      bio: data.bio,
      portfolioUrl: data.portfolioUrl,
      linkedinUrl: data.linkedinUrl,
      githubUrl: data.githubUrl,
      tagIds,
    });
    const publicUser = toPublicUser(updated);
    if (!publicUser) return null;
    return attachUserStats(publicUser);
  } catch (error) {
    // Por si en el futuro se marca `User.name` como @unique
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new UsernameTakenError();
    }
    throw error;
  }
}
