import type { Metadata } from "next";
import "./globals.css";

import { AppContextProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Hostel Hub - UMaT Student Accommodation Discovery & Booking",
  description: "Securely discover and book approved off-campus hostels near the University of Mines and Technology (UMaT), Tarkwa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <AppContextProvider>
          {children}
        </AppContextProvider>
      </body>
    </html>
  );
}
