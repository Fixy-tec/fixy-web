import prisma from "../../../prisma";

/**
 * Get recommended requests for a user based on tag matching
 * Recommends requests whose tags overlap with user's tags
 * Excludes requests where user has already applied
 */
export async function getRecommendedRequestsForUser(userId: string, limit: number = 10) {
  try {
    // Get user's tags
    const userTags = await prisma.userTag.findMany({
      where: { userId },
      include: { tag: true },
    });

    if (userTags.length === 0) {
      // No tags, return recent OPEN requests (excluding applied ones)
      return prisma.request.findMany({
        where: {
          status: "ABIERTA",
          creatorId: { not: userId },
          // Exclude requests where user has already applied
          applications: {
            none: { applicantId: userId },
          },
        },
        include: {
          creator: { include: { profile: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    const tagIds = userTags.map((ut) => ut.tagId);

    // Get requests with matching tags, prioritize by match count
    const recommendations = await prisma.request.findMany({
      where: {
        status: "ABIERTA",
        creatorId: { not: userId },
        // Exclude requests where user has already applied
        applications: {
          none: { applicantId: userId },
        },
        tags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      include: {
        creator: { include: { profile: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Sort by tag match count (most matches first)
    return recommendations.sort((a, b) => {
      const aMatches = a.tags.filter((t) => tagIds.includes(t.tagId)).length;
      const bMatches = b.tags.filter((t) => tagIds.includes(t.tagId)).length;
      return bMatches - aMatches;
    });
  } catch (error) {
    throw new Error("Failed to get recommendations");
  }
}

/**
 * Get recommended users for a request based on tag matching
 * Returns applicants whose tags match the request tags
 * Excludes: creator, users who already applied, users without profile
 */
export async function getRecommendedApplicantsForRequest(requestId: string) {
  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { tags: { include: { tag: true } } },
    });

    if (!request || request.tags.length === 0) {
      return [];
    }

    const requestTagIds = request.tags.map((rt) => rt.tagId);

    // Get users with matching tags (excluding creator and those who already applied)
    // Also require profile to be present (users who have completed onboarding)
    const applicants = await prisma.user.findMany({
      where: {
        id: { not: request.creatorId },
        NOT: {
          applications: {
            some: { requestId },
          },
        },
        userTags: {
          some: {
            tagId: {
              in: requestTagIds,
            },
          },
        },
        profile: {
          isNot: null, // Only users with profile
        },
      },
      include: {
        profile: true,
        userTags: { include: { tag: true } },
      },
      take: 20,
    });

    // Sort by match count (most matches first)
    return applicants.sort((a, b) => {
      const aMatches = a.userTags.filter((ut) => requestTagIds.includes(ut.tagId)).length;
      const bMatches = b.userTags.filter((ut) => requestTagIds.includes(ut.tagId)).length;
      return bMatches - aMatches;
    });
  } catch (error) {
    throw new Error("Failed to get recommended applicants");
  }
}

/**
 * Calculate match percentage between a request and a user based on tags
 * Returns a percentage (0-100) indicating how many tags match
 */
export async function calculateMatchPercentage(userId: string, requestId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userTags: true },
    });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { tags: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!request) {
      throw new Error("Request not found");
    }

    if (user.userTags.length === 0 || request.tags.length === 0) {
      return 0;
    }

    const userTagIds = user.userTags.map((ut) => ut.tagId);
    const requestTagIds = request.tags.map((rt) => rt.tagId);

    const matches = userTagIds.filter((tagId) => requestTagIds.includes(tagId)).length;
    const totalTags = new Set([...userTagIds, ...requestTagIds]).size;

    return Math.round((matches / totalTags) * 100);
  } catch (error: any) {
    if (error.message === "User not found" || error.message === "Request not found") {
      throw error;
    }
    throw new Error("Failed to calculate match percentage");
  }
}
