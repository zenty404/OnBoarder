// ============================================================
// LAYOUT PRINCIPAL DE L'APPLICATION (app/layout.tsx)
// ============================================================


import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "OnBoarder - Tableau de bord",
  description: "Mini-CRM pour indépendants et TPE - Projet ElarDev",
};

// --- COMPOSANT LAYOUT ---
// C'est le composant racine. Il enveloppe TOUTES les pages de l'application.
// "children" représente le contenu de la page actuellement affichée (ex: page.tsx).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`} data-theme="light" style={{ colorScheme: "light" }}>
      <body className="h-full bg-gray-50 font-sans text-gray-900">
        {children}
      </body>
    </html>
  );
}
