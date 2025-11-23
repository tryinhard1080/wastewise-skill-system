"use client";

/**
 * Audit Log Table Component
 *
 * Displays filterable audit log with JSON diff viewer
 * Supports export to CSV
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Download, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  changes?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

interface AuditLogTableProps {
  logs: AuditLog[];
  onExport?: () => void;
}

export function AuditLogTable({ logs, onExport }: AuditLogTableProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.admin_email.toLowerCase().includes(search.toLowerCase()) ||
      log.target_id.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const actionTypes = Array.from(new Set(logs.map((log) => log.action)));

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "destructive" | "outline"> = {
      create: "default",
      update: "outline",
      delete: "destructive",
      disable: "destructive",
      enable: "default",
    };

    return <Badge variant={variants[action] || "outline"}>{action}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by admin or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.admin_email}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {log.target_type}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {log.target_id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {log.ip_address || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Admin
                              </div>
                              <div className="text-sm">{log.admin_email}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Action
                              </div>
                              <div className="text-sm">{log.action}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Target
                              </div>
                              <div className="text-sm">{log.target_type}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Target ID
                              </div>
                              <div className="text-sm font-mono">
                                {log.target_id}
                              </div>
                            </div>
                          </div>
                          {log.changes && (
                            <div>
                              <div className="text-sm font-medium text-gray-500 mb-2">
                                Changes
                              </div>
                              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredLogs.length} of {logs.length} audit logs
      </div>
    </div>
  );
}
