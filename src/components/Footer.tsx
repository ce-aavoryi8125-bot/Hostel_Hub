import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-black/5 w-full py-6">
      <div className="max-w-container-max mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2 mb-1">
            <img src="/umat-logo.png" alt="UMaT" className="h-6 w-auto object-contain grayscale opacity-70" />
            <span className="font-headline-md text-lg font-extrabold text-on-surface tracking-tight">Hostel Hub</span>
          </div>
          <span className="text-[10px] text-on-surface-variant">© 2026 UMaT Student Accommodation Marketplace.</span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <Link className="text-xs text-on-surface-variant font-semibold hover:text-primary transition-colors" href="/explore?campus=main">Main Campus</Link>
          <Link className="text-xs text-on-surface-variant font-semibold hover:text-primary transition-colors" href="/support">Support</Link>
          <Link className="text-xs text-on-surface-variant font-semibold hover:text-primary transition-colors" href="#">Privacy</Link>
          <Link className="text-xs text-on-surface-variant font-semibold hover:text-primary transition-colors" href="#">Terms</Link>
        </div>

        <div className="flex gap-4">
          <a className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">
            <span className="material-symbols-outlined text-xl">face_nod</span>
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">
            <span className="material-symbols-outlined text-xl">alternate_email</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
