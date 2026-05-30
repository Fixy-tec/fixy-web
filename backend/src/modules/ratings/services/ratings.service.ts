import * as ratingsRepository from "../repositories/ratings.repository";
import * as pointlogRepository from "../../pointlog/repositories/pointlog.repository";
import * as pointsUtils from "../../../utils/points.utils";
import prisma from "../../../prisma";

interface CreateRatingInput {
  applicationId: string;
  raterId: string;
  stars: number;
  comment?: string;
}

interface UpdateRatingInput {
  stars?: number;
  comment?: string;
}

export async function createRating(input: CreateRatingInput) {
  if (!input.applicationId || !input.raterId) {
    throw new Error("ApplicationId and raterId are required");
  }

  if (input.stars < 1 || input.stars > 5) {
    throw new Error("Stars must be between 1 and 5");
  }

  // Verify application exists and get the rated user
  const application = await ratingsRepository.getApplicationForRating(input.applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  // Verify request is COMPLETADA (not just application accepted)
  if (application.request.status !== "COMPLETADA") {
    throw new Error("Can only rate when the request is completed");
  }

  // Verify application is ACEPTADA
  if (application.status !== "ACEPTADA") {
    throw new Error("Can only rate accepted applications");
  }

  // Verify rater is the request creator
  if (application.request.creatorId !== input.raterId) {
    throw new Error("Only the request creator can rate the applicant");
  }

  // Verify this specific rater hasn't rated this application yet (allow mutual ratings)
  const existingRating = await ratingsRepository.getRatingByApplicationAndRater(
    input.applicationId,
    input.raterId
  );
  if (existingRating) {
    throw new Error("You have already rated this applicant");
  }

  // Create rating
  const rating = await ratingsRepository.createRating({
    applicationId: input.applicationId,
    raterId: input.raterId,
    ratedId: application.applicantId,
    stars: input.stars,
    comment: input.comment,
  });

  // Calculate and award points to the applicant (rated user)
  const applicantPoints = pointsUtils.calculateApplicantPoints(
    application.request.basePoints,
    input.stars
  );

  // Update user points and medal
  const applicantUser = await prisma.user.findUnique({
    where: { id: application.applicantId },
    select: { id: true, points: true, medal: true },
  });

  if (applicantUser) {
    const newPoints = Math.max(0, applicantUser.points + applicantPoints);
    const newMedal = pointsUtils.getMedalByPoints(newPoints);

    // Update user
    await prisma.user.update({
      where: { id: applicantUser.id },
      data: { points: newPoints, medal: newMedal },
    });

    // Create point log for applicant
    await pointlogRepository.createPointLog({
      userId: applicantUser.id,
      delta: applicantPoints,
      reason: pointsUtils.buildPointLogReason("RATING_RECEIVED", {
        requestTitle: application.request.title,
        stars: input.stars,
        requestId: application.request.id,
      }),
      ratingId: rating.id,
      requestId: application.request.id,
    });

    // Recalculate and update avgRating in profile
    const allReceivedRatings = await ratingsRepository.getRatingsByRatedUser(application.applicantId);
    if (allReceivedRatings.length > 0) {
      const avgRating = allReceivedRatings.reduce((sum, r) => sum + r.stars, 0) / allReceivedRatings.length;
      await prisma.profile.update({
        where: { userId: application.applicantId },
        data: { avgRating: Math.round(avgRating * 100) / 100 }, // Round to 2 decimals
      });
    }
  }

  return rating;
}

export async function getRating(id: string) {
  const rating = await ratingsRepository.getRating(id);
  if (!rating) {
    throw new Error("Rating not found");
  }
  return rating;
}

export async function getRatingsByRatedUser(userId: string) {
  return ratingsRepository.getRatingsByRatedUser(userId);
}

export async function updateRating(id: string, userId: string, input: UpdateRatingInput) {
  // BLOCKED: Ratings cannot be updated to preserve reputation integrity
  throw new Error("Ratings cannot be modified after creation");
}

export async function deleteRating(id: string, userId: string) {
  // BLOCKED: Ratings cannot be deleted to preserve reputation integrity
  throw new Error("Ratings cannot be deleted after creation");
}

/**
 * Crear rating del aplicante al creador del request
 */
export async function createApplicantRating(input: CreateRatingInput) {
  if (!input.applicationId || !input.raterId) {
    throw new Error("ApplicationId and raterId are required");
  }

  if (input.stars < 1 || input.stars > 5) {
    throw new Error("Stars must be between 1 and 5");
  }

  // Verify application exists
  const application = await ratingsRepository.getApplicationForRating(input.applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  // Verify request is COMPLETADA (not just application accepted)
  if (application.request.status !== "COMPLETADA") {
    throw new Error("Can only rate when the request is completed");
  }

  // Verify application is ACEPTADA
  if (application.status !== "ACEPTADA") {
    throw new Error("Can only rate accepted applications");
  }

  // Verify rater is the applicant
  if (application.applicantId !== input.raterId) {
    throw new Error("Only the applicant can rate the request creator");
  }

  // Verify rating doesn't already exist from this applicant to creator
  const existingRating = await ratingsRepository.getRatingByApplicationAndRater(
    input.applicationId,
    input.raterId
  );
  if (existingRating) {
    throw new Error("You have already rated this request creator");
  }

  // Create rating
  const rating = await ratingsRepository.createRating({
    applicationId: input.applicationId,
    raterId: input.raterId,
    ratedId: application.request.creatorId,
    stars: input.stars,
    comment: input.comment,
  });

  // Puntos finales del creador (bonus +20% × modificador del rating, o
  // penalización plana si el aplicante le puso 1★/2★).
  const finalCreatorPoints = pointsUtils.calculateCreatorPointsWithRating(
    application.request.basePoints,
    input.stars,
  );

  // Update creator user points and medal
  const creatorUser = await prisma.user.findUnique({
    where: { id: application.request.creatorId },
    select: { id: true, points: true, medal: true },
  });

  if (creatorUser) {
    const newPoints = Math.max(0, creatorUser.points + finalCreatorPoints);
    const newMedal = pointsUtils.getMedalByPoints(newPoints);

    // Update user
    await prisma.user.update({
      where: { id: creatorUser.id },
      data: { points: newPoints, medal: newMedal },
    });

    // Create point log for creator
    await pointlogRepository.createPointLog({
      userId: creatorUser.id,
      delta: finalCreatorPoints,
      reason: pointsUtils.buildPointLogReason("CREATOR_BONUS", {
        requestTitle: application.request.title,
        requestId: application.request.id,
      }),
      ratingId: rating.id,
      requestId: application.request.id,
    });

    // Recalculate and update avgRating in profile
    const allReceivedRatings = await ratingsRepository.getRatingsByRatedUser(application.request.creatorId);
    if (allReceivedRatings.length > 0) {
      const avgRating = allReceivedRatings.reduce((sum, r) => sum + r.stars, 0) / allReceivedRatings.length;
      await prisma.profile.update({
        where: { userId: application.request.creatorId },
        data: { avgRating: Math.round(avgRating * 100) / 100 }, // Round to 2 decimals
      });
    }
  }

  return rating;
}
