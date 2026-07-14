export default function BookingsPage() {
  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 py-12 min-h-[60vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">My Bookings</h1>
        <p className="text-on-surface-variant">Manage your hostel reservations and clearance passes.</p>
      </div>

      <div className="bg-surface-container-low border border-black/5 rounded-2xl p-12 text-center flex flex-col items-center">
        <span className="material-symbols-outlined text-outline text-4xl mb-4">event_seat</span>
        <h3 className="text-lg font-bold text-on-surface mb-2">No Active Bookings</h3>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-6">
          You haven't reserved any rooms yet. When you book a hostel through Hostel Hub, your digital clearance pass will appear here.
        </p>
        <a href="/explore" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md shadow-primary/20">
          Find a Room
        </a>
      </div>
    </div>
  );
}
