"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(".glass-panel");
    elements.forEach((el) => {
      el.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-8");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Searching for: "${searchQuery}"`);
  };

  const handleReserveClick = () => {
    alert("Official UMaT Hostel room reservations hold generated. Redirecting to SRC coordinator panel, bro!");
  };

  return (
    <div className="selection:bg-primary selection:text-white min-h-screen relative bg-background text-foreground">
      {/* ══════ SmartStudy-Inspired High-Tech Cyber Backdrop (Light Mode Adapted) ══════ */}
      
      {/* Square Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Ambient Concentric Cyber-Rings (Radar backdrop) */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[45rem] h-[45rem] rounded-full border border-black/[0.03] pointer-events-none hidden lg:block" />
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full border border-black/[0.02] border-dashed pointer-events-none animate-[spin_120s_linear_infinite] hidden lg:block" />
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[18rem] h-[18rem] rounded-full border border-black/[0.04] pointer-events-none hidden lg:block" />

      {/* Floating Pulsing Cyber-Hexagon SVGs */}
      <svg className="absolute top-[18%] left-[8%] w-24 h-28 text-black/[0.03] pointer-events-none animate-[pulse_6s_ease-in-out_infinite] hidden lg:block" viewBox="0 0 100 115" fill="none">
        <polygon points="50,2 98,30 98,85 50,113 2,85 2,30" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute top-[52%] right-[8%] w-32 h-36 text-black/[0.02] pointer-events-none animate-[pulse_8s_ease-in-out_infinite] hidden lg:block" viewBox="0 0 100 115" fill="none">
        <polygon points="50,2 98,30 98,85 50,113 2,85 2,30" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" />
      </svg>

      {/* Glowing Spline Waves (Faint) */}
      <div className="absolute top-[20%] left-0 w-full h-[600px] pointer-events-none overflow-hidden opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M-100 150 C 300 50, 600 450, 1000 250 C 1200 150, 1400 350, 1600 300"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-[pulse_8s_ease-in-out_infinite]"
          />
          <path
            d="M-50 200 C 350 120, 550 380, 950 320 C 1150 280, 1350 420, 1550 380"
            stroke="rgba(0,0,0,0.04)"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Constellation Nodes - Left Margin */}
      <div className="absolute top-[28%] left-[4%] w-48 h-48 pointer-events-none hidden lg:block opacity-60">
        <svg className="w-full h-full text-black/[0.06]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="15" y1="20" x2="45" y2="35" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="45" y1="35" x2="30" y2="70" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="30" y1="70" x2="75" y2="55" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="45" y1="35" x2="75" y2="55" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="75" y1="55" x2="85" y2="15" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="15" cy="20" r="3.5" fill="rgba(0,0,0,0.1)" className="animate-[pulse_3s_infinite]" />
          <circle cx="45" cy="35" r="5" fill="rgba(0,0,0,0.15)" className="animate-[pulse_4s_infinite]" />
          <circle cx="30" cy="70" r="4" fill="rgba(0,0,0,0.1)" className="animate-[pulse_2s_infinite]" />
          <circle cx="75" cy="55" r="4.5" fill="rgba(0,0,0,0.12)" className="animate-[pulse_5s_infinite]" />
          <circle cx="85" cy="15" r="3" fill="rgba(251,191,36,0.5)" className="animate-[pulse_3.5s_infinite]" />
        </svg>
      </div>

      <div className="relative z-10 pt-8 pb-16">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-4 md:px-8 flex flex-col items-center text-center mb-16">
          <h1 className="font-display-lg text-4xl md:text-6xl lg:text-[72px] max-w-4xl text-on-surface mb-6 leading-[1.1] font-bold tracking-tight">
            Discover the Best <br/> Student Accommodation
          </h1>
          <p className="font-body-lg text-lg md:text-xl text-on-surface-variant max-w-2xl mb-12">
            The premier marketplace connecting UMaT students with verified hostel managers. Discover, compare, and secure your perfect home away from home.
          </p>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl bg-white shadow-xl shadow-black/5 p-2 rounded-full flex flex-col md:flex-row gap-2 border border-black/5 mb-16 relative z-20">
            <div className="flex-1 flex items-center px-6 gap-3 rounded-full">
              <span className="material-symbols-outlined text-outline">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline font-body-md py-3 outline-none" 
                placeholder="Search by Campus, Hostel Name, or Location..." 
                type="text"
              />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 md:py-4 px-10 rounded-full shadow-md shadow-primary/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap">
              Search Hostels
            </button>
          </form>

          {/* Amber-Style Trust Metrics */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 px-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 flex items-center justify-center mb-3 text-on-surface">
                <span className="material-symbols-outlined" style={{ fontSize: "40px", fontVariationSettings: "'wght' 200" }}>apartment</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-1">50+ Hostels</h3>
              <p className="text-sm text-on-surface-variant">Verified and inspected student homes near campus.</p>
            </div>
            
            <div className="flex flex-col items-center text-center relative">
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-black/10"></div>
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-black/10"></div>
              <div className="w-12 h-12 flex items-center justify-center mb-3">
                <img 
                  src="/umat-logo.png" 
                  alt="UMaT Logo" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-1">UMaT Accredited</h3>
              <p className="text-sm text-on-surface-variant">Fully integrated with SRC and Dean of Students.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 flex items-center justify-center mb-3 text-on-surface">
                <span className="material-symbols-outlined" style={{ fontSize: "40px", fontVariationSettings: "'wght' 200" }}>payments</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-1">0% Agent Fees</h3>
              <p className="text-sm text-on-surface-variant">Direct booking means you pay no hidden commissions.</p>
            </div>
          </div>
        </section>

        {/* Filter / Category Pills */}
        <section className="max-w-container-max mx-auto px-4 md:px-8 mb-16">
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold text-on-surface mb-6">Popular Areas in Tarkwa</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {['Bankyim', 'Tamso', 'Brahabobom', 'Akoon', 'Cyanide'].map((category) => (
                <button 
                  key={category} 
                  className="px-6 py-2.5 bg-white border border-black/10 rounded-full text-sm font-semibold text-on-surface hover:border-primary hover:text-primary hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: "16px" }}>location_on</span>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by Room Type */}
        <section className="max-w-container-max mx-auto px-4 md:px-8 mb-16">
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold text-on-surface mb-6">Browse by Room Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
              {[
                { name: '1 in a room', icon: 'person' },
                { name: '2 in a room', icon: 'group' },
                { name: '3 in a room', icon: 'groups' },
                { name: '4 in a room', icon: 'people' },
                { name: 'Homestels', icon: 'house' }
              ].map((type) => (
                <button 
                  key={type.name} 
                  className="bg-white border border-black/5 shadow-sm rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary hover:text-primary hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "24px" }}>{type.icon}</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Listings (Utilitarian Cards) */}
        <section className="max-w-container-max mx-auto px-4 md:px-8 mb-24 bg-white/40 py-16 rounded-3xl border border-black/5">
          <div className="flex justify-between items-end mb-8 px-4">
            <div>
              <h2 className="text-3xl font-bold text-on-surface mb-2">Featured Accommodations</h2>
              <p className="text-on-surface-variant">Highly rated by UMaT students for comfort and security.</p>
            </div>
            <a href="#" className="hidden md:flex text-primary font-semibold hover:underline items-center gap-1">
              View All <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Evandy Hostel", type: "2 in a room", dist: "0.5 km", price: "4,500" },
              { name: "Hall 7", type: "4 in a room", dist: "On Campus", price: "2,200" },
              { name: "Elite Homestel", type: "1 in a room", dist: "1.2 km", price: "6,000" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-md shadow-black/5 border border-black/5 hover:shadow-xl hover:shadow-black/10 transition-all cursor-pointer group">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAttB4qFBgChMDAPHfge7fMBSTfLIvUxPvQRqM_zyrT8ENAyEGvgK448XADjUf_N-0gj7RfSX795rVc8xnVhE4a79r52I0b9pp5Azrg-avTm_akLn1DjNx6gYUAsW8mINARmGCauv6jY-eC9aNxP7_CmfAufD0M1L2EQ4MND_0eNIwYkTtYnucJO0Je_LB9B3NdH4OhBmqLQIqz657cXWvtt2vRo4CmRKZzLTNnYwNKOtnrNsAnPhE0ykWNBYPQ_2qAaxoFEOoKtZ3T"
                    alt="Hostel Room"
                    width={800}
                    height={600}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>star</span>
                    4.9 (120+ reviews)
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>favorite</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-on-surface">{item.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-on-surface-variant mb-4">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: "16px" }}>near_me</span>
                    {item.dist} from Main Campus
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-surface-container-low text-xs font-medium px-2 py-1 rounded text-on-surface-variant">{item.type}</span>
                    <span className="bg-surface-container-low text-xs font-medium px-2 py-1 rounded text-on-surface-variant">WiFi</span>
                    <span className="bg-surface-container-low text-xs font-medium px-2 py-1 rounded text-on-surface-variant">Generator</span>
                  </div>

                  <div className="border-t border-black/5 pt-4 flex justify-between items-center mt-2">
                    <div>
                      <span className="font-bold text-xl text-on-surface">GHC {item.price}</span>
                      <span className="text-xs text-on-surface-variant ml-1">/ sem</span>
                    </div>
                    <button className="text-primary font-bold text-sm border border-primary/20 bg-primary/5 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-colors">
                      View details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center md:hidden">
            <button className="text-primary font-bold border border-primary/20 bg-primary/5 px-6 py-3 rounded-full w-full hover:bg-primary hover:text-white transition-colors">
              View All Accommodations
            </button>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-container-max mx-auto px-4 md:px-8 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-surface mb-4">How Hostel Hub Works</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Book your official UMaT accommodation in three simple steps.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] w-[70%] h-0.5 bg-black/5 -z-10"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white border border-black/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "40px", fontVariationSettings: "'wght' 200" }}>search</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface mb-2">1. Search & Filter</h3>
              <p className="text-sm text-on-surface-variant">Find the perfect 2-in-a-room or homestel in Bankyim, Tamso, or anywhere in Tarkwa.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white border border-black/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "40px", fontVariationSettings: "'wght' 200" }}>verified_user</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface mb-2">2. Secure Booking</h3>
              <p className="text-sm text-on-surface-variant">Reserve immediately through our Dean-verified platform with zero agent commissions.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white border border-black/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "40px", fontVariationSettings: "'wght' 200" }}>key</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface mb-2">3. Move In</h3>
              <p className="text-sm text-on-surface-variant">Get your digital clearance pass and move straight into your new home on campus.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-container-max mx-auto px-4 md:px-8 mb-16">
          <div className="bg-white border border-black/10 rounded-2xl p-12 text-center shadow-sm">
            <h2 className="text-3xl font-bold text-on-surface mb-3">Ready to Secure Your Room?</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto mb-8 text-sm">
              Join thousands of UMaT students who have already found their perfect accommodation. Don't wait until the best spots in Bankyim are taken.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-full shadow-md shadow-primary/20 transition-all active:scale-95 cursor-pointer">
                Create an Account
              </Link>
              <Link href="/explore" className="bg-white border border-black/10 text-on-surface font-bold px-8 py-3 rounded-full hover:bg-black/5 transition-all cursor-pointer">
                Browse Hostels First
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
