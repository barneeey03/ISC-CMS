"use client";

import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { dataStore } from "@/app/lib/dataStore";
import { Users, FileCheck, XCircle, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { email } = useAuth();
  const allCrews = dataStore.getAllCrews();
  const approvedCount = allCrews.filter((c) => c.status === "approved").length;
  const pendingCount = allCrews.filter((c) => c.status === "pending").length;
  const disapprovedCount = allCrews.filter((c) => c.status === "disapproved").length;

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />
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
                    <p className="text-muted-foreground text-sm font-semibold">Pending</p>
                    <p className="text-3xl font-extrabold text-accent mt-2">{pendingCount}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              {/* Approved */}
              <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-green-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Approved</p>
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

            {/* Recent Activity */}
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <h2 className="text-xl font-extrabold text-accent mb-4">Quick Overview</h2>
              <p className="text-muted-foreground mb-4">
                You are managing the Recruitment Management System. Navigate to Crew Applications to add or review crew members.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary rounded-lg p-4 border border-border hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-accent mb-2">Total Crew Members</h3>
                  <p className="text-2xl font-extrabold text-primary">{allCrews.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-accent mb-2">Approval Rate</h3>
                  <p className="text-2xl font-extrabold text-green-600">
                    {allCrews.length > 0
                      ? Math.round((approvedCount / allCrews.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-accent mb-2">Pending Review</h3>
                  <p className="text-2xl font-extrabold text-red-600">{pendingCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
