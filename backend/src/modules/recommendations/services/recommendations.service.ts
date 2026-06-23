import * as recommendationsRepository from "../repositories/recommendations.repository";
import prisma from "../../../prisma";

export async function getRecommendedRequests(userId: string, limit: number = 10) {
  if (!userId) {
    throw new Error("UserId is required");
  }

  return recommendationsRepository.getRecommendedRequestsForUser(userId, limit);
}

export async function getRecommendedApplicants(requestId: string) {
  if (!requestId) {
    throw new Error("RequestId is required");
  }

  return recommendationsRepository.getRecommendedApplicantsForRequest(requestId);
}

export async function getMatchPercentage(userId: string, requestId: string) {
  if (!userId || !requestId) {
    throw new Error("UserId and RequestId are required");
  }

  return recommendationsRepository.calculateMatchPercentage(userId, requestId);
}

/**
 * Verify that a user owns a request
 * Used for authorization checks on sensitive endpoints
 */
export async function verifyRequestOwnership(requestId: string, userId: string): Promise<boolean> {
  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { creatorId: true },
    });
    
    return request?.creatorId === userId;
  } catch (error) {
    return false;
  }
}
