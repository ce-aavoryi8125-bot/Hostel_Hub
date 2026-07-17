export default function SupportPage() {
  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 py-12 min-h-[60vh]">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-on-surface mb-4">Contact Support</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          Need help finding a hostel or have an issue with your booking? Our UMaT SRC support team is here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-on-surface mb-6">Send us a message</h2>
          <form className="space-y-4 flex flex-col">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Full Name</label>
              <input type="text" className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="Kwame Nkrumah" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Email or Phone Number</label>
              <input type="text" className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Message</label>
              <textarea rows={4} className="w-full bg-surface-container-low border border-black/10 rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-full transition-all shadow-md shadow-primary/20 mt-2">
              Send Message
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-center space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">support_agent</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface">SRC Welfare Office</h3>
              <p className="text-sm text-on-surface-variant mt-1">Visit us at the SRC block on the Main Campus for in-person accommodation assistance.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">call</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Emergency Hotline</h3>
              <p className="text-sm text-on-surface-variant mt-1">+233 50 000 0000</p>
              <p className="text-xs text-outline mt-1">Available Mon-Fri, 8AM to 5PM</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">report</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Report Fraud</h3>
              <p className="text-sm text-on-surface-variant mt-1">Encountered a fake agent? Let us know immediately so we can protect other students.</p>
              <a href="#" className="text-primary text-sm font-semibold hover:underline mt-1 inline-block">File a report &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
