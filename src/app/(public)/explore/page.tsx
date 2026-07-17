"use client";

import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const { hostels, currentUser } = useAppContext();
  const router = useRouter();

  const handleBook = (hostelId: string) => {
    if (!currentUser) {
      // Prompt login, pass redirect URL
      router.push(`/auth?redirect=/checkout/${hostelId}`);
    } else {
      router.push(`/checkout/${hostelId}`);
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-xl font-bold text-on-surface mb-6">Filters</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Campus</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-black/20 text-primary focus:ring-primary" defaultChecked />
                  <span className="text-sm text-on-surface">Main Campus</span>
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Room Type</h3>
              <div className="space-y-2">
                {['1 in a room', '2 in a room', '3 in a room', '4 in a room', 'Homestel'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-black/20 text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-on-surface">Explore Hostels</h1>
            <select className="bg-white border border-black/10 rounded-md text-sm py-1.5 px-3 outline-none focus:border-primary">
              <option>Sort by: Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Distance to Campus</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.map((hostel) => {
              const isFull = hostel.slotsFilled >= hostel.maxSlots;
              
              return (
                <div key={hostel.id} className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="h-48 bg-surface-container-highest relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10"></div>
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface z-20">
                      {hostel.location}
                    </span>
                    {isFull && (
                      <span className="absolute top-4 right-4 bg-error text-white px-3 py-1 rounded-full text-xs font-bold z-20">
                        Fully Booked
                      </span>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-on-surface leading-tight mb-1">{hostel.name}</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-4">
                      <span className="material-symbols-outlined text-[16px]">bed</span>
                      {hostel.roomType}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-black/5 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-on-surface-variant font-medium mb-0.5">Price</p>
                        <p className="font-bold text-primary">{hostel.price}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleBook(hostel.id)}
                        disabled={isFull}
                        className="bg-on-surface hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isFull ? "Full" : "Book"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
