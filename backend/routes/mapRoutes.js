import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getNearbyUsers, updateUserLocation } from "../controllers/mapController.js";

const router = express.Router();

// GET /api/map/nearby-users
router.get("/nearby-users", authMiddleware, getNearbyUsers);

// PUT /api/map/location
router.put("/location", authMiddleware, updateUserLocation);

export default router;
