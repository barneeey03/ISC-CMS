"use client";

import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { dataStore } from "@/app/lib/dataStore";
import { Users, FileCheck, XCircle, TrendingUp, AlertCircle, Ship } from "lucide-react";

export default function SuperAdminDashboard() {
  const { email } = useAuth();
  const allCrews = dataStore.getAllCrews();
  const approvedCount = allCrews.filter((c) => c.status === "approved").length;
  const pendingCount = allCrews.filter((c) => c.status === "pending").length;
  const disapprovedCount = allCrews.filter((c) => c.status === "disapproved").length;

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex">
        <SuperAdminSidebar />
        <div className="flex-1 bg-background min-h-screen">
          {/* Header */}
          <div className="bg-card border-b border-border p-6">
            <h1 className="text-3xl font-extrabold text-accent">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {email}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Crew */}
              <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-primary hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Total Crew</p>
                    <p className="text-3xl font-extrabold text-accent mt-2">{allCrews.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-primary opacity-20" />
                </div>
              </div>

              {/* Pending Applications */}
              <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Pending Review</p>
                    <p className="text-3xl font-extrabold text-accent mt-2">{pendingCount}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              {/* Approved */}
              <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-green-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Approved Crew</p>
                    <p className="text-3xl font-extrabold text-accent mt-2">{approvedCount}</p>
                  </div>
                  <FileCheck className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </div>

              {/* Disapproved */}
              <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-red-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Disapproved</p>
                    <p className="text-3xl font-extrabold text-accent mt-2">{disapprovedCount}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Overview */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-xl font-extrabold text-accent mb-4">System Overview</h2>
                <p className="text-muted-foreground mb-4">Full system access with recruitment and crewing management capabilities.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-accent font-semibold">Manage all recruitment applications</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-accent font-semibold">Full crew database access</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-accent font-semibold">Assign vessels to crew members</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-accent font-semibold">Monitor certificate expiry dates</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <h2 className="text-xl font-extrabold text-accent mb-4">System Statistics</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-accent font-semibold">Approval Rate</span>
                    <span className="text-2xl font-extrabold text-green-600">
                      {allCrews.length > 0 ? Math.round((approvedCount / allCrews.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-accent font-semibold">Pending Review</span>
                    <span className="text-2xl font-extrabold text-blue-600">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-accent font-semibold">Needs Attention</span>
                    <span className="text-2xl font-extrabold text-red-600">{disapprovedCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-8 bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-xl font-extrabold text-accent mb-4">Available Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary rounded-lg border border-border hover:shadow-md transition-shadow">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-bold text-accent mb-1">Crew Applications</h3>
                  <p className="text-xs text-muted-foreground">Review and manage all recruitment applications</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg border border-border hover:shadow-md transition-shadow">
                  <Ship className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-bold text-accent mb-1">Vessel Assignment</h3>
                  <p className="text-xs text-muted-foreground">Assign crews to vessels and manage transfers</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg border border-border hover:shadow-md transition-shadow">
                  <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                  <h3 className="font-bold text-accent mb-1">Certificate Monitoring</h3>
                  <p className="text-xs text-muted-foreground">Track expiring certificates and compliance</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg border border-border hover:shadow-md transition-shadow">
                  <FileCheck className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-bold text-accent mb-1">Crew Database</h3>
                  <p className="text-xs text-muted-foreground">Access complete crew information and history</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
