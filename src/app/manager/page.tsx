"use client";

import { useAppContext } from "@/context/AppContext";

export default function ManagerDashboard() {
  const { hostels, bookings, updateBookingStatus } = useAppContext();
  
  // Calculate dynamic metrics
  const totalSlots = hostels.reduce((acc, h) => acc + h.maxSlots, 0);
  const filledSlots = hostels.reduce((acc, h) => acc + h.slotsFilled, 0);
  const activeInquiries = bookings.filter(b => b.status === "Pending").length;

  const metrics = [
    { label: "Total Views", value: "2,451", trend: "+12.5%", icon: "visibility" },
    { label: "Active Inquiries", value: activeInquiries.toString(), trend: "+5", icon: "chat" },
    { label: "Booked Rooms", value: `${filledSlots} / ${totalSlots}`, trend: `${Math.round((filledSlots/totalSlots)*100)}% Full`, icon: "bed" },
    { label: "Pending Payments", value: "GH₵ 12,500", trend: "Requires Action", icon: "payments" },
  ];

  const recentBookings = [...bookings].reverse().slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Welcome Back, Kwame</h1>
        <p className="text-on-surface-variant text-sm">Here's what's happening with your properties today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{metric.icon}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${metric.trend.includes("+") || metric.trend.includes("Full") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                {metric.trend}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface-variant">{metric.label}</h3>
              <p className="text-2xl font-bold text-on-surface mt-1">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-on-surface">Recent Booking Inquiries</h2>
            <button className="text-sm font-semibold text-primary hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {recentBookings.map((booking) => {
              const hostel = hostels.find(h => h.id === booking.hostelId);
              return (
                <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl border border-black/5 hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold text-xs uppercase">
                      {booking.studentName.substring(0, 3)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Inquiry: {hostel?.roomType}</p>
                      <p className="text-xs text-on-surface-variant">{hostel?.name} • Ref: {booking.studentRef}</p>
                    </div>
                  </div>
                  {booking.status === "Pending" ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateBookingStatus(booking.id, "Approved")}
                        className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors">
                        Approve
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${booking.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {booking.status}
                    </span>
                  )}
                </div>
              );
            })}
            {recentBookings.length === 0 && (
              <p className="text-sm text-on-surface-variant py-4 text-center">No recent inquiries.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-on-surface mb-6">Quick Actions</h2>
          <div className="space-y-3 flex-1">
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/10 hover:border-primary hover:text-primary transition-all text-sm font-semibold text-on-surface-variant text-left">
              <span className="material-symbols-outlined">add_business</span>
              List a New Room
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/10 hover:border-primary hover:text-primary transition-all text-sm font-semibold text-on-surface-variant text-left">
              <span className="material-symbols-outlined">campaign</span>
              Create an Announcement
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-black/10 hover:border-primary hover:text-primary transition-all text-sm font-semibold text-on-surface-variant text-left">
              <span className="material-symbols-outlined">support_agent</span>
              Contact SRC Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
