// ============================================================
// LAYOUT PRINCIPAL DE L'APPLICATION (app/layout.tsx)
// ============================================================
// Ce fichier est le "squelette" HTML de toutes les pages du site.
// Next.js l'utilise comme base pour injecter le contenu de chaque page
// via la prop "children". C'est ici qu'on déclare les polices,
// les métadonnées SEO et les styles globaux.
// ============================================================

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// --- CONFIGURATION DE LA POLICE ---
// On utilise "Geist", une police moderne et lisible fournie par Vercel.
// La variable CSS "--font-geist-sans" permet de l'utiliser dans Tailwind.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// --- MÉTADONNÉES SEO ---
// Ces infos apparaissent dans l'onglet du navigateur et dans les résultats Google.
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
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 font-sans text-gray-900">
        {children}
      </body>
    </html>
  );
}
