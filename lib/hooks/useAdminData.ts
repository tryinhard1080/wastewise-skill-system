/**
 * Admin Data Hooks
 *
 * SWR hooks for fetching admin data
 */

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers(filters?: {
  search?: string;
  role?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.role) params.append("role", filters.role);
  if (filters?.status) params.append("status", filters.status);

  const queryString = params.toString();
  return useSWR(
    `/api/admin/users${queryString ? `?${queryString}` : ""}`,
    fetcher,
  );
}

export function useUser(userId: string) {
  return useSWR(userId ? `/api/admin/users/${userId}` : null, fetcher);
}

export function useJobs(filters?: {
  status?: string;
  type?: string;
  userId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.userId) params.append("user_id", filters.userId);

  const queryString = params.toString();
  return useSWR(
    `/api/admin/jobs${queryString ? `?${queryString}` : ""}`,
    fetcher,
  );
}

export function useJobStats() {
  return useSWR("/api/admin/jobs/stats", fetcher);
}

export function useSystemMetrics(period?: "24h" | "7d" | "30d") {
  const params = new URLSearchParams();
  if (period) params.append("period", period);

  const queryString = params.toString();
  return useSWR(
    `/api/admin/system/metrics${queryString ? `?${queryString}` : ""}`,
    fetcher,
  );
}

export function useSystemHealth() {
  return useSWR("/api/admin/system/health", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSkillsConfig() {
  return useSWR("/api/admin/skills", fetcher);
}

export function useAuditLogs(filters?: {
  admin?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.admin) params.append("admin", filters.admin);
  if (filters?.action) params.append("action", filters.action);
  if (filters?.startDate) params.append("start_date", filters.startDate);
  if (filters?.endDate) params.append("end_date", filters.endDate);

  const queryString = params.toString();
  return useSWR(
    `/api/admin/audit${queryString ? `?${queryString}` : ""}`,
    fetcher,
  );
}

// Mutation functions
export async function disableUser(userId: string, reason?: string) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: false, disable_reason: reason }),
  });
  if (!res.ok) throw new Error("Failed to disable user");
  return res.json();
}

export async function enableUser(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: true }),
  });
  if (!res.ok) throw new Error("Failed to enable user");
  return res.json();
}

export async function changeUserRole(userId: string, role: string) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to change user role");
  return res.json();
}

export async function deleteUser(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function retryJob(jobId: string) {
  const res = await fetch(`/api/admin/jobs/${jobId}/retry`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to retry job");
  return res.json();
}

export async function deleteJob(jobId: string) {
  const res = await fetch(`/api/admin/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete job");
  return res.json();
}

export async function updateSkillConfig(skillId: string, config: any) {
  const res = await fetch(`/api/admin/skills/${skillId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update skill config");
  return res.json();
}

export async function exportAuditLogs() {
  const res = await fetch("/api/admin/audit/export");
  if (!res.ok) throw new Error("Failed to export audit logs");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
