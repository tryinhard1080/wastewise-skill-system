/**
 * Audit Log Page
 *
 * View and export admin audit logs
 */

"use client";

import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs, exportAuditLogs } from "@/lib/hooks/useAdminData";
import { toast } from "sonner";

export default function AuditPage() {
  const { data, isLoading } = useAuditLogs();

  const handleExport = async () => {
    try {
      await exportAuditLogs();
      toast.success("Audit logs exported successfully");
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 mt-2">
          Track all administrative actions and changes
        </p>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <AuditLogTable logs={data?.logs || []} onExport={handleExport} />
      )}
    </div>
  );
}
