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

dotenv.config();

const app = express();

// Configurar CORS para el frontend en puerto 3000
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
