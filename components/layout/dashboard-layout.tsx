"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FolderKanban,
    BarChart3,
    FileText,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Projects", href: "/projects", icon: FolderKanban },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Reports", href: "/reports", icon: FileText },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
                    <span className="text-xl font-bold tracking-tight">WasteWise</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="border-t border-slate-800 p-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6 shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden -ml-2"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    <div className="flex-1">
                        {/* Breadcrumbs or Page Title could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                            RB
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
