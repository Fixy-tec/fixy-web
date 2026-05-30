"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const requests_routes_1 = __importDefault(require("./routes/requests.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const ratings_routes_1 = __importDefault(require("./modules/ratings/routes/ratings.routes"));
const recommendations_routes_1 = __importDefault(require("./modules/recommendations/routes/recommendations.routes"));
const pointlog_routes_1 = __importDefault(require("./modules/pointlog/routes/pointlog.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/routes/notifications.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Confiamos en el primer proxy (Render/Vercel) para que `req.ip` y los headers
// X-Forwarded-* se resuelvan correctamente (útil para rate-limit, logs, etc.).
app.set("trust proxy", 1);
// Lista blanca de orígenes permitidos. En desarrollo usamos los localhost por
// defecto; en producción se inyecta `ALLOWED_ORIGINS` (separado por comas) con
// el dominio de Vercel del frontend.
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use((0, cors_1.default)({
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
}));
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/applications", application_routes_1.default);
app.use("/api/requests", requests_routes_1.default);
app.use("/api/tags", tag_routes_1.default);
app.use("/api/ratings", ratings_routes_1.default);
app.use("/api/recommendations", recommendations_routes_1.default);
app.use("/api/pointlog", pointlog_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
