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
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configurar CORS para el frontend en puerto 3000
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
