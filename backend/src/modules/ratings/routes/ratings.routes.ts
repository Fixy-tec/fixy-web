import { Router } from "express";
import * as ratingsController from "../controllers/ratings.controller";
import { authenticateJWT } from "../../../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Create rating
router.post("/", ratingsController.createRating);

// Get rating by ID
router.get("/:id", ratingsController.getRating);

// Get all ratings for a user
router.get("/user/:userId", ratingsController.getRatingsByUser);

// Update rating
router.put("/:id", ratingsController.updateRating);

// Delete rating
router.delete("/:id", ratingsController.deleteRating);

export default router;
