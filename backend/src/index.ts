import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import applicationRoutes from "./routes/application.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import requestsRoutes from "./routes/requests.routes";
import tagRoutes from "./routes/tag.routes";
import ratingsRoutes from "./modules/ratings/routes/ratings.routes";
import recommendationsRoutes from "./modules/recommendations/routes/recommendations.routes";
import PointlogRoutes from "./modules/pointlog/routes/pointlog.routes";
import notificationsRoutes from "./modules/notifications/routes/notifications.routes";

dotenv.config();

const app = express();

// Confiamos en el primer proxy (Render/Vercel) para que `req.ip` y los headers
// X-Forwarded-* se resuelvan correctamente (útil para rate-limit, logs, etc.).
app.set("trust proxy", 1);

// Lista blanca de orígenes permitidos. En desarrollo usamos los localhost por
// defecto; en producción se inyecta `ALLOWED_ORIGINS` (separado por comas) con
// el dominio de Vercel del frontend.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // `origin` es undefined en requests server-to-server, curl, healthchecks
      // de Render, etc. — los dejamos pasar.
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

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
