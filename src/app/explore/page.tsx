export default function ExplorePage() {
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

          <div className="bg-surface-container-low border border-black/5 rounded-2xl p-12 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-outline text-4xl mb-4">construction</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Explore Page Under Construction</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              We're building the full hostel search and filter experience right now. Soon you'll be able to browse all verified UMaT hostels here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
