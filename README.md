# Hostel Hub UMaT

Hostel Hub is a student accommodation discovery and room reservation holding platform designed for students of the **University of Mines and Technology (UMaT)** in Tarkwa, Ghana. 

The platform helps students securely browse off-campus hostels, compare real-time room options, verify UMaT Dean of Students accreditation status, and call direct managers to schedule tours without agent fraud.

---

## 🎨 Frontend Research & Visual Inspiration

To build a professional, premium, and minimal landing page, we researched industry-leading designs from **scan2tap.com** and **smart-study.app**. The core design principles adopted from this research include:

### 1. Color & Background Systems
*   **Deep Space Aesthetics**: Deep slate/navy background canvas (`#060913`) overlaid with soft geometric grid lines.
*   **Radial Glow Effects**: Vibrant background radial blurs using electric blue and golden glows (`bg-primary-blue/10 blur-[130px]`).
*   **UMaT Brand Hues**: Curated color palette highlighting UMaT primary blue (`#2563eb`) and brand gold (`#fbbf24`).

### 2. Modern Typography & Layout Structure
*   **Outfit Sans-Serif**: Sleek font system with weight contrast, massive tight-leading headers (`tracking-tight leading-[1.05]`), and uppercase subtitle tags.
*   **Sticky Glass Navbar**: Floating backdrop blur panel (`backdrop-blur-md bg-[#060913]/85`) separating user views.
*   **Integrated Hero Conversion**: An inline search-and-claim style input pill centered inside the hero to direct search states instantly.
*   **Infinite Scrolling Marquee**: Horizontal moving ribbon showcasing accredited trust badges, anti-fraud guides, and key residential highlights.

### 3. Micro-Animations & Components
*   **Glassmorphic Cards**: Hostel listings styled with hover glow frames, custom checking tags, and proximity indicators to UMaT Main and Akoon campuses.
*   **Interactive Modal Passes**: Reservation booking passes containing custom ticket-cutout graphics (`ticket-pass`) and micro-physics bounce animations on load.

---

## ⚙️ Technology Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router, v16.2)
*   **Library**: React 19 & Framer Motion (v12.4)
*   **Styling**: Tailwind CSS v4 & Vanilla CSS variables
*   **Icons**: Lucide React

---

## 🚀 Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the local server.

---

## 🛡️ Verification & Compilation

Verify code formatting and type safety:

```bash
# Run ESLint check
npm run lint

# Run TypeScript compilation check
npx tsc --noEmit
```
