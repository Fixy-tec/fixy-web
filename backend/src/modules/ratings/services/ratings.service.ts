import * as ratingsRepository from "../repositories/ratings.repository";

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

  // Verify rater is the request creator
  if (application.request.creatorId !== input.raterId) {
    throw new Error("Only the request creator can rate the applicant");
  }

  // Verify rating doesn't already exist
  const existingRating = await ratingsRepository.getRatingByApplicationId(input.applicationId);
  if (existingRating) {
    throw new Error("Rating for this application already exists");
  }

  return ratingsRepository.createRating({
    applicationId: input.applicationId,
    raterId: input.raterId,
    ratedId: application.applicantId,
    stars: input.stars,
    comment: input.comment,
  });
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
  const rating = await ratingsRepository.getRating(id);
  if (!rating) {
    throw new Error("Rating not found");
  }

  // Only the rater can update
  if (rating.raterId !== userId) {
    throw new Error("Only the rater can update this rating");
  }

  if (input.stars !== undefined) {
    if (input.stars < 1 || input.stars > 5) {
      throw new Error("Stars must be between 1 and 5");
    }
  }

  return ratingsRepository.updateRating(id, input);
}

export async function deleteRating(id: string, userId: string) {
  const rating = await ratingsRepository.getRating(id);
  if (!rating) {
    throw new Error("Rating not found");
  }

  if (rating.raterId !== userId) {
    throw new Error("Only the rater can delete this rating");
  }

  return ratingsRepository.deleteRating(id);
}
