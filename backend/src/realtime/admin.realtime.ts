import { Server as HttpServer } from "http";
import { Server, Namespace } from "socket.io";
import { verifyJwt } from "../utils/jwt";
import * as adminRepository from "../modules/admin/repositories/admin.repository";

let adminNamespace: Namespace | null = null;

function getAllowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : ["http://localhost:3000", "http://127.0.0.1:3000"];
}

export function setupAdminRealtime(httpServer: HttpServer): void {
  const io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  adminNamespace = io.of("/admin");

  adminNamespace.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers.authorization as string | undefined)?.replace(
        "Bearer ",
        "",
      );

    if (!token) {
      return next(new Error("Authorization token missing"));
    }

    try {
      const payload = verifyJwt(token);
      if (payload.role !== "ADMIN") {
        return next(new Error("Insufficient permissions"));
      }
      socket.data.user = payload;
      return next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  adminNamespace.on("connection", (socket) => {
    console.log(
      `[realtime] Admin conectado: ${socket.data.user?.email ?? "unknown"}`,
    );

    socket.on("disconnect", () => {
      console.log(
        `[realtime] Admin desconectado: ${socket.data.user?.email ?? "unknown"}`,
      );
    });
  });
}

export async function notifyAdminDashboardUpdate(): Promise<void> {
  if (!adminNamespace) return;

  try {
    const dashboard = await adminRepository.getDashboardStats();
    adminNamespace.emit("admin:dashboard:update", dashboard);
  } catch (error) {
    console.error("[admin:dashboard:update] Error emitiendo actualización:", error);
  }
}
