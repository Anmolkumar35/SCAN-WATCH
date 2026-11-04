import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import watchSessionRoutes from "./routes/watchSession.routes.js";
import { authRateLimitConfig, apiRateLimitConfig } from "./middleware/validate.middleware.js";

const app = express();

// 1. Trust proxy for production hosting platforms (Render, Railway, Nginx)
app.set("trust proxy", 1);

// 2. Security Headers (Permit cross-origin media streaming)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 3. Dynamic CORS for local development and deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// 4. Request Size Limiters
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// 5. Data Sanitization against NoSQL injection
app.use(mongoSanitize());

// 6. Global API Rate Limiter
const globalLimiter = rateLimit(apiRateLimitConfig);
app.use("/api", globalLimiter);

// 7. Strict Auth Rate Limiter
const authLimiter = rateLimit(authRateLimitConfig);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// 8. Static Movie Files (Local disk fallback)
app.use("/uploads", express.static(path.resolve("uploads")));

// 9. Mount Core Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/watch-sessions", watchSessionRoutes);

// 10. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

// 11. Centralized Safe Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Application Error:", err.message);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  return res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again later."
        : err.message || "Internal Server Error",
  });
});

export default app;