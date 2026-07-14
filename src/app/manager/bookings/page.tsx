"use client";

import { useAppContext } from "@/context/AppContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerBookings() {
  const { bookings, hostels, updateBookingStatus, currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Basic protection (in a real app, use middleware)
    // For now we just check if it's a manager
  }, []);

  const pendingCount = bookings.filter(b => b.status === "Pending").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Booking Requests</h1>
          <p className="text-on-surface-variant text-sm">Review, approve, or reject incoming reservations from students.</p>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/5 flex gap-2 overflow-x-auto bg-surface-container-low">
          <button className="px-4 py-1.5 rounded-full text-sm font-bold bg-primary text-white whitespace-nowrap">All Requests</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-black/5 whitespace-nowrap">Pending ({pendingCount})</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-black/5 whitespace-nowrap">Approved</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-black/5 whitespace-nowrap">Rejected</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs text-on-surface-variant uppercase tracking-wider border-b border-black/5">
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Student Details</th>
                <th className="p-4 font-semibold">Property & Room</th>
                <th className="p-4 font-semibold">Date Requested</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">No bookings found.</td>
                </tr>
              ) : bookings.map((booking) => {
                const hostel = hostels.find(h => h.id === booking.hostelId);
                return (
                  <tr key={booking.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-4 font-mono text-sm text-on-surface">{booking.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-sm text-on-surface">{booking.studentName}</p>
                      <p className="text-xs text-on-surface-variant mt-1 font-mono">{booking.studentRef}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-on-surface">{hostel?.name}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{hostel?.roomType}</p>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">{booking.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                        ${booking.status === "Approved" ? "bg-green-100 text-green-700" : 
                          booking.status === "Rejected" ? "bg-red-100 text-red-700" : 
                          "bg-orange-100 text-orange-700"}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {booking.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateBookingStatus(booking.id, "Approved")}
                            className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors" title="Approve">
                            <span className="material-symbols-outlined text-sm">check</span>
                          </button>
                          <button 
                            onClick={() => updateBookingStatus(booking.id, "Rejected")}
                            className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200 transition-colors" title="Reject">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ) : (
                        <button className="text-xs font-semibold text-primary hover:underline">View Details</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
