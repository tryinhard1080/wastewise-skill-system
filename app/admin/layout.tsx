/**
 * Admin Layout
 *
 * Protected layout for admin users only
 * Provides admin sidebar navigation and breadcrumbs
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin (from user metadata or email)
  // TODO: Replace with proper role check from database once admin tables are created
  const isAdmin =
    user.user_metadata?.role === "admin" ||
    user.email?.endsWith("@admin.wastewise.local");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar user={user} />
      <div className="lg:pl-64">
        {/* Header with Admin Badge */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <Badge variant="destructive" className="text-xs">
                  ADMIN
                </Badge>
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </header>

        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
