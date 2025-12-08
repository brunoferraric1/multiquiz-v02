'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                {children}
            </div>
        </ProtectedRoute>
    );
}
