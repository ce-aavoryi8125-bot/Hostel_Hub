"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Hostel = {
  id: string;
  name: string;
  location: string;
  roomType: string;
  price: string;
  slotsFilled: number;
  maxSlots: number;
  managerId: string;
};

export type Booking = {
  id: string;
  studentName: string;
  studentRef: string;
  hostelId: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
};

export type User = {
  role: "student" | "manager" | "admin" | null;
  name: string;
  refOrId: string;
} | null;

type AppContextType = {
  hostels: Hostel[];
  bookings: Booking[];
  currentUser: User;
  login: (role: "student" | "manager" | "admin", name: string, refOrId: string) => void;
  logout: () => void;
  bookHostel: (hostelId: string) => void;
  updateBookingStatus: (bookingId: string, status: "Pending" | "Approved" | "Rejected") => void;
};

const initialHostels: Hostel[] = [
  { id: "h1", name: "Evandy Hostel - Block A", location: "Bankyim", roomType: "2 in a room", price: "GH₵ 3,500/yr", slotsFilled: 45, maxSlots: 50, managerId: "m1" },
  { id: "h2", name: "Evandy Hostel - Block B", location: "Bankyim", roomType: "4 in a room", price: "GH₵ 2,000/yr", slotsFilled: 100, maxSlots: 100, managerId: "m1" },
  { id: "h3", name: "Elite Homestel", location: "Tamso", roomType: "1 in a room", price: "GH₵ 5,000/yr", slotsFilled: 2, maxSlots: 5, managerId: "m2" },
];

const initialBookings: Booking[] = [
  { id: "b1", studentName: "Sarah Mensah", studentRef: "UMaT/REF/2026/089", hostelId: "h1", date: "Today, 10:45 AM", status: "Pending" }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [hostels, setHostels] = useState<Hostel[]>(initialHostels);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [currentUser, setCurrentUser] = useState<User>(null);

  const login = (role: "student" | "manager" | "admin", name: string, refOrId: string) => {
    setCurrentUser({ role, name, refOrId });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const bookHostel = (hostelId: string) => {
    if (!currentUser || currentUser.role !== "student") return;

    const newBooking: Booking = {
      id: `b${Date.now()}`,
      studentName: currentUser.name,
      studentRef: currentUser.refOrId,
      hostelId: hostelId,
      date: new Date().toLocaleDateString(),
      status: "Pending"
    };

    setBookings((prev) => [...prev, newBooking]);
    // NOTE: We don't decrement available slots until the admin/manager approves the payment
    // as per the user's logic: "If payment goes through, the admin is not supposed to automatically approve. The listing page is supposed to be dynamically updated based on the orders placed"
    // To simulate "orders placed", we can either decrement immediately or wait for approval. Let's decrement on approval.
  };

  const updateBookingStatus = (bookingId: string, status: "Pending" | "Approved" | "Rejected") => {
    setBookings((prev) => 
      prev.map(b => {
        if (b.id === bookingId) {
          // If transitioning to Approved, fill a slot
          if (b.status !== "Approved" && status === "Approved") {
            setHostels(hList => hList.map(h => 
              h.id === b.hostelId ? { ...h, slotsFilled: h.slotsFilled + 1 } : h
            ));
          }
          // If transitioning from Approved to Rejected, free a slot
          if (b.status === "Approved" && status === "Rejected") {
            setHostels(hList => hList.map(h => 
              h.id === b.hostelId ? { ...h, slotsFilled: h.slotsFilled - 1 } : h
            ));
          }
          return { ...b, status };
        }
        return b;
      })
    );
  };

  return (
    <AppContext.Provider value={{ hostels, bookings, currentUser, login, logout, bookHostel, updateBookingStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
