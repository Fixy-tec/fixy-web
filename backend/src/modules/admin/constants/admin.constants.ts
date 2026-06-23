import { ApplicationStatus, RequestStatus } from "@prisma/client";

/** Estados de request que bloquean cambio de rol o eliminación de usuario. */
export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  "ABIERTA",
  "EN_REVISION",
  "EN_PROCESO",
];

/** Applications aceptadas que bloquean cambio de rol o eliminación. */
export const BLOCKING_APPLICATION_STATUS: ApplicationStatus = "ACEPTADA";

export const ACTIVE_ACADEMIC_PROCESS_MESSAGE =
  "No es posible realizar la operación porque el usuario tiene procesos académicos activos";

export const ROOT_ADMIN_DELETE_MESSAGE =
  "El administrador principal del sistema no puede eliminarse";
