// backend/controllers/mapController.js
import User from "../models/user.js";
import Habit from "../models/habit.js";
import Circle from "../models/Circle.js";

/**
 * Get nearby users that the current user is allowed to see
 * - Only members of circles (public or private) the user belongs to
 * - Users filtered by optional habit
 */
export const getNearbyUsers = async (req, res) => {
    try {
        const { lat, lng, radius, habit } = req.query;
        const currentUserId = req.user.id;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required." });
        }

        const radiusInMeters = (radius ? parseFloat(radius) : 10) * 1000;

        // Step 1: Find circles the current user can see (public + private where user is member)
        const circles = await Circle.find({
            $or: [
                { visibility: "public" },
                { visibility: "private", members: currentUserId }
            ]
        }).select("members");

        // Collect all unique member IDs from these circles
        const allowedUserIds = new Set();
        circles.forEach(circle => {
            circle.members.forEach(memberId => allowedUserIds.add(memberId.toString()));
        });

        // Remove current user from the set
        allowedUserIds.delete(currentUserId);

        if (!allowedUserIds.size) {
            return res.status(200).json({ success: true, users: [] });
        }

        // Step 2: Find nearby users **within allowed users only**
        const nearbyUsers = await User.find({
            _id: { $in: Array.from(allowedUserIds) },
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        }).select("name location");

        if (!nearbyUsers.length) {
            return res.status(200).json({ success: true, users: [] });
        }

        const userIds = nearbyUsers.map(u => u._id);

        // Step 3: Filter users by habit (if provided)
        let habitQuery = { user: { $in: userIds } };
        if (habit) {
            habitQuery.name = { $regex: new RegExp(habit, "i") };
        }

        const activeHabits = await Habit.find(habitQuery);

        // Step 4: Build final result
        const result = nearbyUsers
            .map(user => {
                const userMatchedHabits = activeHabits.filter(h => h.user.toString() === user._id.toString());
                return {
                    _id: user._id,
                    name: user.name,
                    location: user.location,
                    habits: userMatchedHabits.map(h => ({
                        _id: h._id,
                        name: h.name,
                        streak: h.streak,
                        status: h.status,
                        icon: h.icon,
                        emoji: h.emoji
                    })),
                };
            })
            .filter(u => u.habits.length > 0 || !habit); // if habit filter, keep only users with matching habits

        res.status(200).json({ success: true, users: result });
    } catch (error) {
        console.error("getNearbyUsers error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch nearby users." });
    }
};

/**
 * Update the current user's location
 */
export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: "Missing coordinates." });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        user.location = {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };

        await user.save();

        res.status(200).json({ success: true, message: "Location updated successfully." });
    } catch (error) {
        console.error("updateUserLocation error:", error);
        res.status(500).json({ success: false, message: "Failed to update location." });
    }
};