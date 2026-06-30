import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import applicationRoutes from "./routes/application.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import requestsRoutes from "./routes/requests.routes";
import tagRoutes from "./routes/tag.routes";
import ratingsRoutes from "./modules/ratings/routes/ratings.routes";
import recommendationsRoutes from "./modules/recommendations/routes/recommendations.routes";
import PointlogRoutes from "./modules/pointlog/routes/pointlog.routes";
import notificationsRoutes from "./modules/notifications/routes/notifications.routes";
import adminRoutes from "./modules/admin/routes/admin.routes";
import { setupRealtime } from "./realtime";
import "express-async-errors";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/pointlog", PointlogRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);

// ─── Ruta no encontrada (404) ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── Manejo global de errores — siempre al final ───────────────
app.use(
  (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
    });
  },
);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const httpServer = createServer(app);
setupRealtime(httpServer);

httpServer.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});