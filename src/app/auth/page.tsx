"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 py-12 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <img 
            src="/umat-logo.png" 
            alt="UMaT Logo" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-on-surface mb-2">{isLogin ? "Welcome Back" : "Freshers Registration"}</h1>
          <p className="text-on-surface-variant text-sm">
            {isLogin 
              ? "Sign in with your portal credentials." 
              : "Register using your UMaT Admission Reference Number."}
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">Reference Number</label>
            <input type="text" className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="e.g. UMaT/REF/2026/001" />
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
            <input type="password" className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="••••••••" />
          </div>

          <button type="button" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-full transition-all shadow-md shadow-primary/20 mt-4">
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Register here" : "Sign in instead"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
