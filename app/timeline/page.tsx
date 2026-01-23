"use client";

import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import jsPDF from "jspdf";
import "jspdf-autotable";

type Assignment = {
  id: string;
  crewId: string;
  crewName: string;
  vesselName: string;
  principal: string;
  signedOn: string;
  signedOff: string | null;
};

const toTimestamp = (date: string) => new Date(date).getTime();

const calculateDays = (start: string, end: string | null) => {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function TimelinePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showHighlightOnly, setShowHighlightOnly] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "vesselAssignments"), orderBy("signedOn", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Assignment[] = [];
      snap.forEach((doc) => list.push({ ...(doc.data() as any), id: doc.id }));
      setAssignments(list);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!showHighlightOnly) return assignments;
    return assignments.filter((a) => calculateDays(a.signedOn, a.signedOff) < 70);
  }, [assignments, showHighlightOnly]);

  const ganttData = useMemo(() => {
    // Group by crew
    const map: Record<string, any> = {};
    filtered.forEach((a) => {
      if (!map[a.crewName]) map[a.crewName] = [];
      map[a.crewName].push({
        ...a,
        start: toTimestamp(a.signedOn),
        end: a.signedOff ? toTimestamp(a.signedOff) : Date.now(),
        days: calculateDays(a.signedOn, a.signedOff),
      });
    });

    return Object.keys(map).map((crewName) => ({
      crewName,
      assignments: map[crewName],
    }));
  }, [filtered]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Highlighted Crew (<70 days) Timeline", 14, 20);
    (doc as any).autoTable({
      head: [["Crew", "Vessel", "Signed On", "Signed Off", "Days"]],
      body: filtered
        .filter((a) => calculateDays(a.signedOn, a.signedOff) < 70)
        .map((a) => [
          a.crewName,
          a.vesselName,
          a.signedOn,
          a.signedOff || "Still onboard",
          calculateDays(a.signedOn, a.signedOff),
        ]),
      startY: 30,
    });
    doc.save("highlighted-timeline.pdf");
  };

  const minTime = useMemo(() => {
    const times = filtered.map((a) => toTimestamp(a.signedOn));
    return Math.min(...times);
  }, [filtered]);

  const maxTime = useMemo(() => {
    const times = filtered.map((a) => (a.signedOff ? toTimestamp(a.signedOff) : Date.now()));
    return Math.max(...times);
  }, [filtered]);

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex min-h-screen">
        <SuperAdminSidebar />
        <div className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-4">Timeline</h1>

          <div className="flex gap-3 mb-4">
            <button
              className={`px-4 py-2 rounded-lg border ${
                showHighlightOnly ? "bg-yellow-400 text-black" : "bg-gray-50"
              }`}
              onClick={() => setShowHighlightOnly(!showHighlightOnly)}
            >
              Highlight {"<70 days"}
            </button>

            <button
              onClick={exportPDF}
              className="px-4 py-2 rounded-lg border bg-green-600 text-white"
            >
              Export Highlighted PDF
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-xl font-bold mb-2">Gantt Timeline</h2>

            <div style={{ width: "100%", height: 450 }}>
              <ResponsiveContainer>
                <BarChart
                  layout="vertical"
                  data={ganttData}
                  margin={{ top: 20, right: 40, left: 100, bottom: 20 }}
                >
                  <XAxis
                    type="number"
                    domain={[minTime, maxTime]}
                    tickFormatter={(tick) => new Date(tick).toISOString().slice(0, 10)}
                  />
                  <YAxis type="category" dataKey="crewName" />
                  <Tooltip
                    formatter={(value) => new Date(value as number).toISOString().slice(0, 10)}
                    labelFormatter={(label) => `Crew: ${label}`}
                  />

                  {ganttData.map((row, index) => {
                    return (
                      <Bar
                        key={index}
                        dataKey="assignments"
                        isAnimationActive={false}
                        barSize={12}
                        shape={(props: any) => {
                          const { x, y, width, height, payload } = props;
                          const a = payload.assignments[0];

                          return (
                            <g>
                              {payload.assignments.map((as: any, idx: number) => {
                                const start = ((as.start - minTime) / (maxTime - minTime)) * width;
                                const end = ((as.end - minTime) / (maxTime - minTime)) * width;
                                const w = end - start;

                                return (
                                  <rect
                                    key={idx}
                                    x={x + start}
                                    y={y + idx * (height + 6)}
                                    width={w}
                                    height={height}
                                    rx={4}
                                    fill={as.days < 70 ? "#fbbf24" : "#60a5fa"}
                                  />
                                );
                              })}
                            </g>
                          );
                        }}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
