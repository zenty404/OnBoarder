// ============================================================
// PAGE PRINCIPALE : TABLEAU DE BORD (DASHBOARD)
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";


// ============================================================
// SECTION 1 : DONNÉES STATIQUES (ne changent pas)
// ============================================================

const elementsNavigation = [
    { nom: "Tableau de bord", href: "/",              actif: true, icone: "/dashbord.png" },
    { nom: "Entreprises",     href: "/entreprises",   actif: false, icone: "/entreprises.png" },
    { nom: "Contacts",        href: "/contacts",      actif: false,  icone: "/contacts.png" },
    { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
    { nom: "Ticket",          href: "/tickets",        actif: false, icone: "/tickets.png" },

];


// ============================================================
// SECTION 2 : FONCTION UTILITAIRE
// ============================================================


function formaterMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}


// ============================================================
// SECTION 3 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================

export default function PageTableauDeBord() {

  // ----------------------------------------------------------
  // ÉTATS LOCAUX (useState)
  // ----------------------------------------------------------

  const [emailUtilisateur, setEmailUtilisateur] = useState("");

  const [totalContacts, setTotalContacts] = useState(0);

  const [opportunitesEnCours, setOpportunitesEnCours] = useState(0);

  const [chiffreAffaires, setChiffreAffaires] = useState(0);

  const [chargement, setChargement] = useState(true);

  // ----------------------------------------------------------
  // HOOK DE NAVIGATION
  // ----------------------------------------------------------
  const router = useRouter();


  // ----------------------------------------------------------
  // useEffect : VÉRIFICATION DE SESSION + CHARGEMENT DES DONNÉES
  // ----------------------------------------------------------
  

  useEffect(() => {
    async function verifierSessionEtChargerDonnees() {

      // ======================================================
      // ÉTAPE 1 : Vérifier la session utilisateur
      // ======================================================
      
      const { data: { session } } = await supabase.auth.getSession();

      
      if (!session) {
        router.push("/login");
        return;
      }

      setEmailUtilisateur(session.user.email ?? "");

      // ======================================================
      // ÉTAPE 2 : Lancer les 3 requêtes Supabase en parallèle
      // ======================================================
     
      const [resultatContacts, resultatOpportunites, resultatDeals] = await Promise.all([

        // --------------------------------------------------
        // REQUÊTE 1 : Compter le nombre total de contacts
        // --------------------------------------------------
       
        supabase
          .from("contacts")
          .select("*", { count: "exact", head: true }),

        // --------------------------------------------------
        // REQUÊTE 2 : Compter les opportunités "en cours"
        // --------------------------------------------------
        
        supabase
          .from("deals")
          .select("*", { count: "exact", head: true })
          .in("status", ["À contacter", "En négociation"]),

        // --------------------------------------------------
        // REQUÊTE 3 : Récupérer les montants des deals non perdus
        // --------------------------------------------------
        
        supabase
          .from("deals")
          .select("amount")
          .neq("status", "Perdu"),
      ]);

      // ======================================================
      // ÉTAPE 3 : Extraire et stocker les résultats
      // ======================================================

      setTotalContacts(resultatContacts.count ?? 0);

      setOpportunitesEnCours(resultatOpportunites.count ?? 0);

      
      const deals = resultatDeals.data ?? [];
      const somme = deals.reduce((somme, deal) => somme + (deal.amount ?? 0), 0);
      setChiffreAffaires(somme);

      setChargement(false);
    }

    verifierSessionEtChargerDonnees();
  }, [router]);


  // ----------------------------------------------------------
  // FONCTION : Déconnexion
  // ----------------------------------------------------------
  

  async function gererDeconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }


  // ----------------------------------------------------------
  // ÉTAT DE CHARGEMENT
  // ----------------------------------------------------------

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Chargement de vos statistiques…</p>
      </div>
    );
  }


  // ----------------------------------------------------------
  // EXTRACTION DU PRÉNOM depuis l'email
  // ----------------------------------------------------------
  const prenom = emailUtilisateur.split("@")[0];


  // ----------------------------------------------------------
  // RENDU JSX : Layout identique à la maquette validée
  // ----------------------------------------------------------

  return (
    <div className="flex h-full min-h-screen">

      {/* ======================================================== */}
      {/* SIDEBAR : Menu de navigation latéral gauche               */}
      {/* ======================================================== */}
      <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">

          <div className="px-6 py-5">
            <h1 className="text-xl font-bold text-indigo-600">OnBoarder</h1>
          </div>

         
          <nav className="flex-1 px-3 py-2">
            <ul className="space-y-1">
              {elementsNavigation.map((element) => (
                <li key={element.nom}>
                  <a
                    href={element.href}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                      transition-colors duration-150
                      ${element.actif
                        ? "bg-indigo-50 text-indigo-600" /* Style actif : fond bleu clair + texte bleu */
                        : "text-gray-700 hover:bg-gray-100" /* Style inactif : texte gris + survol gris */
                      }
                    `}
                  >
                    <Image src={element.icone} alt={element.nom} width={20} height={20} />
                    {element.nom}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* ZONE PRINCIPALE : Header + Contenu du dashboard           */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col">

      
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Tableau de bord</h2>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {emailUtilisateur}
            </span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button
              onClick={gererDeconnexion}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* CONTENU PRINCIPAL : Statistiques + Bandeau bienvenue   */}
        {/* ---------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ================================================== */}
          {/* CARTES DE STATISTIQUES (3 cartes en ligne)           */}
          {/* ================================================== */}
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/contacts.png" alt="Contacts" width={22} height={22} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total des contacts
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalContacts}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/opportunites.png" alt="Opportunités" width={22} height={22} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Opportunités en cours
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {opportunitesEnCours}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/dollar.png" alt="Chiffre d'affaires" width={22} height={22} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Chiffre d'affaires potentiel
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {formaterMontant(chiffreAffaires)}
              </p>
            </div>
          </div>

          {/* ================================================== */}
          {/* BANDEAU DE BIENVENUE                                 */}
          {/* ================================================== */}
          <div className="rounded-2xl bg-gray-100 p-8">
            <div className="z-10 max-w-xl">
              <h3 className="text-2xl font-bold text-gray-900">
                Bienvenue, {prenom}.
              </h3>
              <p className="mt-3  text-gray-600">
                Vos indicateurs de performance sont à jour. L'atelier de précision
                analyse vos données pour optimiser vos prochaines opportunités
                commerciales.
              </p>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
