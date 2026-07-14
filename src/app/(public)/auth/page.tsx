"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [refNum, setRefNum] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAppContext();

  const handleSubmit = () => {
    if (!refNum) return;
    
    // Mock successful student login
    login("student", "Bernard Appiah", refNum);
    
    const redirectUrl = searchParams.get("redirect");
    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push("/bookings");
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 py-12 min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <img 
            src="/umat-logo.png" 
            alt="UMaT Logo" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-on-surface mb-2">
            {isLogin ? "Welcome Back" : "Freshers Registration"}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {isLogin ? "Sign in to manage your accommodation." : "Register to find and book your hostel."}
          </p>
        </div>

        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Reference Number</label>
            <input 
              type="text" 
              value={refNum}
              onChange={(e) => setRefNum(e.target.value)}
              className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" 
              placeholder="e.g. UMaT/REF/2026/001" 
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Phone Number</label>
              <input type="tel" className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="050 000 0000" />
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-on-surface-variant">Password</label>
              {isLogin && <a href="#" className="text-xs text-primary font-semibold hover:underline">Forgot?</a>}
            </div>
            <input type="password" className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="••••••••" required />
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-full transition-all shadow-md shadow-primary/20 mt-4">
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-on-surface-variant">
            {isLogin ? "Don't have an account?" : "Already registered?"}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary font-bold ml-2 hover:underline"
            >
              {isLogin ? "Register here" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
