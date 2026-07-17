"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewProperty() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/manager/properties" className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-black/5 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">List a New Property</h1>
          <p className="text-on-surface-variant text-sm">Step {step} of 3: Basic Details</p>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex gap-2 mb-8">
          <div className="h-2 flex-1 bg-primary rounded-full"></div>
          <div className="h-2 flex-1 bg-surface-container-highest rounded-full"></div>
          <div className="h-2 flex-1 bg-surface-container-highest rounded-full"></div>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Property/Hostel Name</label>
              <input 
                type="text" 
                className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" 
                placeholder="e.g. Evandy Hostel - Block C" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Location/Area</label>
              <select className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm appearance-none">
                <option>Bankyim</option>
                <option>Tamso</option>
                <option>Brahabobom</option>
                <option>Cyanide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Distance to Campus</label>
              <select className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm appearance-none">
                <option>Less than 5 mins walk</option>
                <option>5 - 10 mins walk</option>
                <option>10 - 20 mins walk</option>
                <option>Requires a taxi/shuttle</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Property Description</label>
              <textarea 
                rows={4}
                className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" 
                placeholder="Describe the atmosphere, security, and unique features..." 
              ></textarea>
            </div>
          </div>

          <div className="border-t border-black/5 pt-6 mt-6 flex justify-end">
            <button type="button" className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-md shadow-primary/20 text-sm">
              Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
