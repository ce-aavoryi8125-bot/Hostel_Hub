"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ManagerAccessPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login logic
    setTimeout(() => {
      setLoading(false);
      router.push("/manager");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">real_estate_agent</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Manager Portal</h1>
          <p className="text-on-surface-variant text-sm">
            Enter your unique access token to manage your hostel listings.
          </p>
        </div>

        <form onSubmit={handleAccess} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">Access Token</label>
            <input 
              type="password" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary font-mono tracking-widest text-center" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !token}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">login</span>
            )}
            Access Dashboard
          </button>
        </form>

        <div className="mt-8 text-center border-t border-black/5 pt-6">
          <Link href="/" className="text-sm text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Return to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
