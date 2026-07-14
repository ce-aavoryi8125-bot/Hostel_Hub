"use client";

import Link from "next/link";

export default function ManagerProperties() {
  const properties = [
    { id: 1, name: "Evandy Hostel - Block A", type: "2 in a room", price: "GH₵ 3,500/yr", status: "Available", slots: "15 / 50" },
    { id: 2, name: "Evandy Hostel - Block B", type: "4 in a room", price: "GH₵ 2,000/yr", status: "Full", slots: "100 / 100" },
    { id: 3, name: "Evandy Executive", type: "1 in a room", price: "GH₵ 6,000/yr", status: "Maintenance", slots: "0 / 10" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">My Properties</h1>
          <p className="text-on-surface-variant text-sm">Manage your listings, update availability, and adjust pricing.</p>
        </div>
        <Link 
          href="/manager/properties/new"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          List New Property
        </Link>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/5 flex justify-between items-center bg-surface-container-low">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search properties..." 
              className="w-full bg-white border border-black/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface border border-black/10 px-4 py-2 rounded-lg bg-white hidden sm:flex">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 text-xs text-on-surface-variant uppercase tracking-wider border-b border-black/5">
                <th className="p-4 font-semibold">Property Name</th>
                <th className="p-4 font-semibold">Room Type</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Slots Filled</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((prop) => (
                <tr key={prop.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sm text-on-surface">{prop.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">ID: #PROP-{1000 + prop.id}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-on-surface-variant bg-black/5 px-2.5 py-1 rounded-md">{prop.type}</span>
                  </td>
                  <td className="p-4 text-sm font-semibold text-on-surface">{prop.price}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-on-surface-variant w-14">{prop.slots}</span>
                      <div className="w-24 h-2 bg-black/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${prop.status === "Full" ? "bg-error" : prop.status === "Maintenance" ? "bg-orange-500" : "bg-primary"}`}
                          style={{ width: `${(parseInt(prop.slots.split(" / ")[0]) / parseInt(prop.slots.split(" / ")[1])) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                      ${prop.status === "Available" ? "bg-green-100 text-green-700" : 
                        prop.status === "Full" ? "bg-red-100 text-red-700" : 
                        "bg-orange-100 text-orange-700"}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${prop.status === "Available" ? "bg-green-500" : prop.status === "Full" ? "bg-red-500" : "bg-orange-500"}`}></span>
                      {prop.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
