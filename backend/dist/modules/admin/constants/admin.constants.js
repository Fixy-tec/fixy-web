"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_ADMIN_DELETE_MESSAGE = exports.ACTIVE_ACADEMIC_PROCESS_MESSAGE = exports.BLOCKING_APPLICATION_STATUS = exports.ACTIVE_REQUEST_STATUSES = void 0;
/** Estados de request que bloquean cambio de rol o eliminación de usuario. */
exports.ACTIVE_REQUEST_STATUSES = [
    "ABIERTA",
    "EN_REVISION",
    "EN_PROCESO",
];
/** Applications aceptadas que bloquean cambio de rol o eliminación. */
exports.BLOCKING_APPLICATION_STATUS = "ACEPTADA";
exports.ACTIVE_ACADEMIC_PROCESS_MESSAGE = "No es posible realizar la operación porque el usuario tiene procesos académicos activos";
exports.ROOT_ADMIN_DELETE_MESSAGE = "El administrador principal del sistema no puede eliminarse";
