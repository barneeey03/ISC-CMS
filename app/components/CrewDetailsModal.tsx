"use client";

import React from "react";
import { X } from "lucide-react";
import { CrewMember } from "@/app/lib/type";

export function CrewDetailsModal({
  crew,
  onClose,
  onApprove,
  onDisapprove,
}: {
  crew: CrewMember;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDisapprove: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-3xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Crew Details</h2>
          <button onClick={onClose} className="text-black/60 hover:text-black">
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-black/60">Full Name</p>
              <p className="font-semibold">{crew.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-black/60">Email</p>
              <p className="font-semibold">{crew.emailAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-black/60">Mobile</p>
              <p className="font-semibold">{crew.mobileNumber}</p>
            </div>
            <div>
              <p className="text-xs text-black/60">Age</p>
              <p className="font-semibold">{crew.age}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-black/60">Nationality</p>
              <p className="font-semibold">{crew.nationality}</p>
            </div>
            <div>
              <p className="text-xs text-black/60">Vessel Type</p>
              <p className="font-semibold">{crew.vesselType}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-black/60">Address</p>
            <p className="font-semibold">{crew.completeAddress}</p>
          </div>

          <div className="flex gap-3 mt-4">
            {crew.status !== "approved" && (
              <button
                onClick={() => onApprove(crew.id)}
                className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
              >
                Approve
              </button>
            )}

            {crew.status !== "disapproved" && (
              <button
                onClick={() => onDisapprove(crew.id)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
              >
                Disapprove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
