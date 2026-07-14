"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { currentUser, bookings, hostels } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") {
      router.push("/auth");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  // Get the student's bookings
  const studentBookings = bookings.filter(b => b.studentRef === currentUser.refOrId);
  const activeBooking = studentBookings.length > 0 ? studentBookings[studentBookings.length - 1] : null;
  const bookedHostel = activeBooking ? hostels.find(h => h.id === activeBooking.hostelId) : null;

  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 py-8 min-h-[80vh]">
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        
        {/* Student Profile Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-primary/10"></div>
            <div className="relative z-10 flex flex-col items-center mt-8">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-surface-container-highest shadow-md flex items-center justify-center text-3xl font-bold text-on-surface-variant mb-4">
                {currentUser.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-on-surface text-center">{currentUser.name}</h2>
              <p className="text-sm text-on-surface-variant font-mono mt-1">{currentUser.refOrId}</p>
              
              <div className="w-full border-t border-black/5 my-6"></div>
              
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Programme:</span>
                  <span className="font-semibold text-on-surface">General Student</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Level:</span>
                  <span className="font-semibold text-on-surface">100</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold transition-all text-left ${activeTab === "overview" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-black/5 text-on-surface-variant hover:border-black/10 hover:bg-black/5"}`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard Overview
            </button>
            <button 
              onClick={() => setActiveTab("passes")}
              className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold transition-all text-left ${activeTab === "passes" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-black/5 text-on-surface-variant hover:border-black/10 hover:bg-black/5"}`}
            >
              <span className="material-symbols-outlined">badge</span>
              Clearance Passes
            </button>
            <button 
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold transition-all text-left ${activeTab === "saved" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-black/5 text-on-surface-variant hover:border-black/10 hover:bg-black/5"}`}
            >
              <span className="material-symbols-outlined">favorite</span>
              Saved Hostels
            </button>
          </nav>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-grow">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-on-surface">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
              
              {/* Active Booking Card */}
              {activeBooking && bookedHostel ? (
                <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      {activeBooking.status === "Approved" ? (
                        <>
                          <span className="material-symbols-outlined text-green-600 bg-white p-1.5 rounded-full shadow-sm">verified</span>
                          <span className="text-sm font-bold text-green-700 uppercase tracking-widest">Approved Reservation</span>
                        </>
                      ) : activeBooking.status === "Pending" ? (
                        <>
                          <span className="material-symbols-outlined text-orange-500 bg-white p-1.5 rounded-full shadow-sm">pending_actions</span>
                          <span className="text-sm font-bold text-orange-600 uppercase tracking-widest">Pending Review</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-red-500 bg-white p-1.5 rounded-full shadow-sm">cancel</span>
                          <span className="text-sm font-bold text-red-600 uppercase tracking-widest">Rejected</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div>
                        <h2 className="text-3xl font-bold text-on-surface mb-2">{bookedHostel.name}</h2>
                        <p className="text-on-surface-variant font-medium flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">bed</span>
                          {bookedHostel.roomType}
                        </p>
                        <p className="text-on-surface-variant font-medium flex items-center gap-2 mt-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          Requested: {activeBooking.date}
                        </p>
                      </div>
                      {activeBooking.status === "Approved" && (
                        <button onClick={() => setActiveTab("passes")} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-primary/20 text-sm whitespace-nowrap">
                          View Digital Pass
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-low border border-black/5 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-black/5">
                    <span className="material-symbols-outlined text-on-surface-variant text-2xl">bed</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">No Active Bookings</h3>
                  <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">You haven't booked a hostel yet. Head over to the Explore page to find your perfect room.</p>
                  <Link href="/explore" className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all inline-block shadow-md shadow-primary/20">
                    Explore Hostels
                  </Link>
                </div>
              )}

              {/* Grid of actions/stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Payment History
                  </h3>
                  <div className="space-y-4">
                    {activeBooking ? (
                       <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-low border border-black/5">
                        <div>
                          <p className="text-sm font-bold text-on-surface">Room Reservation</p>
                          <p className="text-xs text-on-surface-variant">{activeBooking.date}</p>
                        </div>
                        <span className="text-sm font-bold text-green-600">{bookedHostel?.price}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant">No payments recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "passes" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-on-surface">Digital Clearance Pass</h1>

              {!activeBooking || activeBooking.status !== "Approved" ? (
                <div className="bg-surface-container-low border border-black/5 rounded-3xl p-12 text-center mt-8">
                  <span className="material-symbols-outlined text-outline text-4xl mb-4">lock</span>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Pass Unavailable</h3>
                  <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                    Your clearance pass will be generated here once your hostel booking has been approved by the manager.
                  </p>
                </div>
              ) : (
                <div className="bg-white border-2 border-black/10 rounded-3xl shadow-lg max-w-xl mx-auto overflow-hidden mt-8">
                  <div className="bg-primary p-6 text-center text-white relative">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                      {/* Abstract pattern */}
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
                    </div>
                    <h2 className="text-2xl font-black tracking-widest uppercase relative z-10">Hostel Hub</h2>
                    <p className="text-primary-50 text-sm tracking-widest uppercase mt-1 relative z-10">Official UMaT Clearance</p>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Student</p>
                        <p className="text-lg font-bold text-on-surface">{currentUser.name}</p>
                        <p className="text-sm font-mono text-on-surface-variant">{currentUser.refOrId}</p>
                      </div>
                      <div className="w-16 h-16 bg-surface-container-highest rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant">qr_code_2</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Hostel</p>
                        <p className="text-sm font-bold text-on-surface">{bookedHostel?.name}</p>
                        <p className="text-sm text-on-surface-variant">{bookedHostel?.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Room Type</p>
                        <p className="text-sm font-bold text-on-surface">{bookedHostel?.roomType}</p>
                      </div>
                    </div>

                    <div className="border-t-2 border-dashed border-black/10 pt-6 mt-2 text-center">
                      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">Verification Status</p>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        Payment Confirmed & Cleared
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-on-surface">Saved Hostels</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low border border-black/5 rounded-3xl p-12 text-center col-span-2">
                  <h3 className="text-lg font-bold text-on-surface mb-2">No Saved Hostels</h3>
                  <p className="text-on-surface-variant text-sm">You haven't bookmarked any hostels yet.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
