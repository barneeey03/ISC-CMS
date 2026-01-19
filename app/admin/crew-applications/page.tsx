"use client";

import { useState, useCallback } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { dataStore } from "@/app/lib/dataStore";
import { Plus, FileText, CheckCircle, XCircle } from "lucide-react";

export default function CrewApplications() {
  const [showForm, setShowForm] = useState(false);
  const [crews, setCrews] = useState(dataStore.getAllCrews());
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "disapproved">("all");

  const refreshCrews = useCallback(() => {
    setCrews(dataStore.getAllCrews());
  }, []);

  const handleApprove = (id: string) => {
    dataStore.updateCrew(id, { status: "approved" });
    refreshCrews();
  };

  const handleDisapprove = (id: string) => {
    dataStore.updateCrew(id, { status: "disapproved" });
    refreshCrews();
  };

  // Filter crews based on search and status
  const filteredCrews = crews.filter((crew) => {
    const matchesSearch = crew.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          crew.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          crew.mobileNumber.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || crew.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCrews = crews.filter((c) => c.status === "pending");
  const approvedCrews = crews.filter((c) => c.status === "approved");
  const disapprovedCrews = crews.filter((c) => c.status === "disapproved");

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 bg-background min-h-screen">
          {/* Header */}
          <div className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-accent">Crew Applications</h1>
                <p className="text-muted-foreground mt-1">Manage all crew applications and statuses</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Crew
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold text-accent">{crews.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600">Pending</p>
                <p className="text-2xl font-bold text-blue-700">{pendingCrews.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-700">{approvedCrews.length}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-600">Disapproved</p>
                <p className="text-2xl font-bold text-red-700">{disapprovedCrews.length}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search and Filter Bar */}
            <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-accent mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by name, email, or mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-accent mb-2">Filter by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disapproved">Disapproved</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredCrews.length === 0 ? (
              <div className="bg-card rounded-lg shadow-md p-12 text-center border border-border">
                <FileText className="w-16 h-16 text-muted-foreground opacity-30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-accent mb-2">No Applications Found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCrews.map((crew) => {
                  const statusColor = crew.status === "pending" ? "border-blue-400 bg-blue-50" : 
                                     crew.status === "approved" ? "border-green-400 bg-green-50" :
                                     "border-red-400 bg-red-50";
                  const statusLabel = crew.status.charAt(0).toUpperCase() + crew.status.slice(1);
                  
                  return (
                  <div
                    key={crew.id}
                    className={`bg-card rounded-lg shadow-sm p-6 border-l-4 hover:shadow-lg transition-shadow border-border ${statusColor}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Full Name</p>
                        <p className="text-lg font-bold text-accent">{crew.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Email</p>
                        <p className="text-sm text-foreground">{crew.emailAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Age</p>
                        <p className="text-lg font-bold text-accent">{crew.age} years</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Nationality</p>
                        <p className="text-sm text-foreground">{crew.nationality}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          crew.status === "pending" ? "bg-blue-200 text-blue-800" :
                          crew.status === "approved" ? "bg-green-200 text-green-800" :
                          "bg-red-200 text-red-800"
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Mobile</p>
                        <p className="text-sm text-foreground">{crew.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Address</p>
                        <p className="text-sm text-foreground line-clamp-1">{crew.completeAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Vessel Type</p>
                        <p className="text-sm text-foreground">{crew.vesselType || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {crew.status !== "approved" && (
                        <button
                          onClick={() => {
                            handleApprove(crew.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                      )}
                      {crew.status !== "disapproved" && (
                        <button
                          onClick={() => {
                            handleDisapprove(crew.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Disapprove
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCrew(crew.id)}
                        className="flex items-center gap-2 px-4 py-2 border border-primary text-primary font-semibold rounded-lg hover:bg-secondary transition-colors text-sm ml-auto"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Modal */}
          {showForm && <CrewApplicationForm onClose={() => setShowForm(false)} onSuccess={refreshCrews} />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
