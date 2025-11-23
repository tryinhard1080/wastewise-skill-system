/**
 * User Management Page
 *
 * List and manage all users
 */

"use client";

import { useState } from "react";
import { UserTable } from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUsers,
  disableUser,
  enableUser,
  changeUserRole,
  deleteUser,
} from "@/lib/hooks/useAdminData";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersPage() {
  const { data, isLoading, mutate } = useUsers();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [roleUserId, setRoleUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("user");

  const handleDisableUser = async (userId: string) => {
    try {
      const user = data?.users?.find((u: any) => u.id === userId);
      if (!user) return;

      if (user.is_active) {
        await disableUser(userId);
        toast.success("User disabled successfully");
      } else {
        await enableUser(userId);
        toast.success("User enabled successfully");
      }
      mutate();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleChangeRole = async () => {
    if (!roleUserId) return;

    try {
      await changeUserRole(roleUserId, newRole);
      toast.success("User role updated successfully");
      setRoleUserId(null);
      mutate();
    } catch (error) {
      toast.error("Failed to change user role");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await deleteUser(deleteUserId);
      toast.success("User deleted successfully");
      setDeleteUserId(null);
      mutate();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-2">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <UserTable
          users={data?.users || []}
          onDisableUser={handleDisableUser}
          onChangeRole={(userId) => {
            setRoleUserId(userId);
            const user = data?.users?.find((u: any) => u.id === userId);
            setNewRole(user?.role || "user");
          }}
          onDeleteUser={setDeleteUserId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={() => setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and all associated data including projects and
              analysis results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleUserId} onOpenChange={() => setRoleUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select the new role for this user. Admin users have full access to
              the admin dashboard and can manage other users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUserId(null)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
