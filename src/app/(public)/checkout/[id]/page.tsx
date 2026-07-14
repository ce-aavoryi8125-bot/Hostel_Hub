"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const { id } = useParams();
  const { hostels, currentUser, bookHostel } = useAppContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Find the selected hostel
  const hostel = hostels.find(h => h.id === id);

  useEffect(() => {
    // If not logged in, boot them to auth
    if (!currentUser) {
      router.push(`/auth?redirect=/checkout/${id}`);
    }
  }, [currentUser, router, id]);

  if (!hostel || !currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-on-surface-variant">Loading checkout...</p>
      </div>
    );
  }

  const handleConfirm = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      bookHostel(hostel.id);
      router.push("/bookings");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-8">
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-6">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to listings
        </Link>
        <h1 className="text-3xl font-bold text-on-surface mb-2">Confirm Your Booking</h1>
        <p className="text-on-surface-variant text-sm">Review your selection before finalizing your reservation.</p>
      </div>

      <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row mb-8">
        <div className="w-full md:w-1/3 bg-surface-container-highest min-h-[200px] relative">
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface z-20">
            {hostel.location}
          </span>
        </div>
        <div className="p-6 md:p-8 flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Hostel</p>
              <h2 className="text-2xl font-bold text-on-surface leading-tight">{hostel.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Price</p>
              <p className="text-xl font-bold text-on-surface">{hostel.price}</p>
            </div>
          </div>
          
          <div className="border-t border-black/5 pt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-on-surface-variant mb-1">Room Type</p>
              <p className="font-semibold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bed</span>
                {hostel.roomType}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-1">Availability</p>
              <p className="font-semibold text-sm flex items-center gap-2 text-green-700">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {hostel.maxSlots - hostel.slotsFilled} slots left
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-black/5 rounded-3xl p-6 md:p-8 mb-8">
        <h3 className="font-bold text-on-surface mb-4">Student Details</h3>
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm">{currentUser.name}</p>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">{currentUser.refOrId}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-green-500">verified</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleConfirm}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-10 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              Processing...
            </>
          ) : (
            <>
              Confirm Reservation
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
