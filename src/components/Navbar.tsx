"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Mock auth state for UI demonstration
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const allLinks = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/explore" },
    { name: "My Bookings", path: "/bookings", requiresAuth: true },
    { name: "Contact Support", path: "/support" },
  ];

  const links = allLinks.filter(link => !link.requiresAuth || isLoggedIn);

  const getLinkClasses = (path: string) => {
    return pathname === path
      ? "font-label-md text-sm text-primary font-bold hover:text-primary transition-colors"
      : "font-label-md text-sm text-on-surface-variant font-semibold hover:text-primary transition-colors";
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black/5 shadow-sm flex justify-between items-center px-8 md:px-16 h-[72px]">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center">
          <img 
            src="/umat-logo.png" 
            alt="UMaT" 
            className="h-8 w-auto object-contain drop-shadow-sm"
          />
        </Link>
        <div className="flex items-center">
          <Link href="/" className="font-headline-md text-[24px] font-extrabold text-on-surface tracking-tight hidden sm:block">Hostel Hub</Link>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <Link key={link.name} href={link.path} className={getLinkClasses(link.path)}>
            {link.name}
          </Link>
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        {!isLoggedIn ? (
          <Link 
            href="/auth"
            className="hidden md:flex bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-label-md text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-95 items-center justify-center"
          >
            Log in / Register
          </Link>
        ) : (
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="hidden md:flex border border-black/10 hover:bg-black/5 text-on-surface px-6 py-2.5 rounded-full font-label-md text-sm font-bold transition-all active:scale-95 items-center justify-center"
          >
            Log out
          </button>
        )}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-on-surface cursor-pointer p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-white border-b border-black/5 flex flex-col p-6 gap-6 md:hidden z-40 shadow-xl">
          {links.map((link) => (
            <Link 
              key={link.name} 
              href={link.path} 
              className={pathname === link.path ? "font-label-md text-base text-primary font-bold" : "font-label-md text-base text-on-surface-variant font-semibold"}
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {!isLoggedIn ? (
            <Link 
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="bg-primary text-white w-full py-3 rounded-full font-bold mt-2 text-center"
            >
              Log in / Register
            </Link>
          ) : (
            <button 
              onClick={() => { setIsLoggedIn(false); setMenuOpen(false); }}
              className="border border-black/10 text-on-surface w-full py-3 rounded-full font-bold mt-2 text-center"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
