"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/manager", icon: "dashboard" },
    { name: "My Properties", href: "/manager/properties", icon: "apartment" },
    { name: "Bookings", href: "/manager/bookings", icon: "book_online" },
    { name: "Settings", href: "/manager/settings", icon: "settings" },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-black/5 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-[72px] flex items-center px-6 border-b border-black/5">
          <Link href="/manager" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">real_estate_agent</span>
            <span className="font-headline-md text-lg font-extrabold text-on-surface tracking-tight">Manager Hub</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 mt-2 px-2">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-on-surface-variant hover:bg-black/5 hover:text-on-surface"}
                `}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/5">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-black/5 hover:text-error transition-all w-full text-left">
            <span className="material-symbols-outlined text-xl">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-black/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-on-surface-variant hover:bg-black/5 p-2 rounded-lg"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold text-on-surface hidden sm:block">
              {navItems.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`))?.name || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors relative">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <div className="h-8 w-[1px] bg-black/10 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                KM
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-bold text-on-surface leading-tight">Kwame Manager</p>
                <p className="text-on-surface-variant text-xs">Evandy Hostel</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
