'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader />
                <main className="relative flex-1">
                    <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />
                    <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />
                    <div className="relative">{children}</div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
