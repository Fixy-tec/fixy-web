"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRealtime = setupRealtime;
const admin_realtime_1 = require("./admin.realtime");
function setupRealtime(httpServer) {
    (0, admin_realtime_1.setupAdminRealtime)(httpServer);
}
