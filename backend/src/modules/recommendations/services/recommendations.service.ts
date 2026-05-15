import * as recommendationsRepository from "../repositories/recommendations.repository";

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
