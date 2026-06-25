import { Role } from "@prisma/client";

export interface AdminUserListItemDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  requestsCreated: number;
  applicationsSent: number;
  isRootAdmin: boolean;
  whatsapp?: string | null;
}

export interface PaginatedUsersDto {
  users: AdminUserListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardUsersDto {
  total: number;
  active: number;
  byRole: Record<Role, number>;
}

export interface DashboardRequestsDto {
  total: number;
  open: number;
  review: number;
  processing: number;
  completed: number;
  cancelled: number;
}

export interface DashboardApplicationsDto {
  pending: number;
  accepted: number;
  rejected: number;
}

export interface ActiveUserDto {
  id: string;
  name: string;
  email: string;
  requestsCreated: number;
  applicationsSent: number;
  totalActivity: number;
}

export interface DashboardMetricsDto {
  avgApplicationsPerRequest: number;
  acceptanceRate: number;
  mostActiveUsers: ActiveUserDto[];
  requestsLast7Days: number;
}

export interface DashboardDto {
  users: DashboardUsersDto;
  requests: DashboardRequestsDto;
  applications: DashboardApplicationsDto;
  metrics: DashboardMetricsDto;
}
