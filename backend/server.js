import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import motivationRoutes from "./routes/motivationRoutes.js";
import streakRestoreRoutes from "./routes/streakRestoreRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import circleRoutes from "./routes/circleRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import { startStreakMonitor } from "./cron/streakMonitor.js";

const app = express();
const server = http.createServer(app);

/* =========================
   ✅ CORS CONFIGURATION
========================= */

// Configure allowed CORS origins from environment (comma-separated)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server & health checks
      if (!origin) return callback(null, true);

      // If no origins are configured, allow all in non-production for convenience,
      // but log a warning in production so ops can set CORS_ORIGINS.
      if (allowedOrigins.length === 0) {
        if (process.env.NODE_ENV === "production") {
          console.warn(
            "CORS: no origins configured in CORS_ORIGINS; allowing all origins."
          );
        }
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

/* =========================
   ✅ SOCKET.IO SETUP
========================= */

export const io = new Server(server, {
  cors: {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
},
});

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

/* =========================
   ✅ MIDDLEWARE
========================= */

app.use(express.json());

/* =========================
   ✅ ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/motivation", motivationRoutes);
app.use("/api/streak-restore", streakRestoreRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/circles", circleRoutes);
app.use("/api/map", mapRoutes);

/* =========================
   ✅ HABIT AUTO STATUS CHECKER
========================= */

const checkHabitStatuses = async () => {
  try {
    const Habit = (await import("./models/habit.js")).default;

    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().split("T")[0];

    const pendingDailyHabits = await Habit.find({
      status: "pending",
      frequency: "daily",
      $nor: [{ completedDates: todayStr }],
    });

    const habitsToUpdate = pendingDailyHabits.filter((habit) => {
      const timeToCompare = habit.timeTo || habit.endTime || habit.time;
      if (!timeToCompare) return false;

      const [hour, minute] = timeToCompare.split(":").map(Number);
      if (isNaN(hour) || isNaN(minute)) return false;

      const habitTimeInMinutes = hour * 60 + minute;
      return currentTimeInMinutes > habitTimeInMinutes;
    });

    for (const habit of habitsToUpdate) {
      const currentHabit = await Habit.findById(habit._id);

      if (currentHabit && currentHabit.status === "pending") {
        currentHabit.status = "missed";
        await currentHabit.save();
        console.log(`Marked habit "${currentHabit.name}" as missed`);
      }
    }
  } catch (error) {
    console.error("Error checking habit statuses:", error);
  }
};

/* =========================
   ✅ HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.send("API is running");
});

/* =========================
   ✅ START SERVER
========================= */

// Global error handlers to keep process stable and allow graceful shutdown
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI environment variable is not set. Aborting startup.");
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const PORT = process.env.PORT ?? 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Run immediately
      checkHabitStatuses();

      // Run every minute
      setInterval(checkHabitStatuses, 60000);

      // Start cron monitor
      startStreakMonitor();
    });

    // Graceful shutdown: close HTTP server and MongoDB connection
    const gracefulExit = (signal) => {
      console.log(`${signal} received. Shutting down...`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log("MongoDB connection closed.");
          process.exit(0);
        });
      });
    };

    process.on("SIGINT", () => gracefulExit("SIGINT"));
    process.on("SIGTERM", () => gracefulExit("SIGTERM"));

  } catch (err) {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${process.env.PORT || 5000} is already in use!`);
    } else {
      console.error("MongoDB Connection Failed:", err);
    }
    process.exit(1);
  }
};

startServer();