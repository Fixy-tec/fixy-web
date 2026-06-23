import { Server as HttpServer } from "http";
import { setupAdminRealtime } from "./admin.realtime";

export function setupRealtime(httpServer: HttpServer): void {
  setupAdminRealtime(httpServer);
}
