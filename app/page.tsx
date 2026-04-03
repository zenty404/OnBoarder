// ============================================================
// PAGE PRINCIPALE : TABLEAU DE BORD (DASHBOARD)
// ============================================================
// Cette page est désormais DYNAMIQUE : elle récupère les vraies
// données depuis Supabase au lieu d'utiliser des mock data.
//
// C'est un Client Component ("use client") car on utilise :
//   - useState  : pour stocker les stats, l'email, l'état de chargement
//   - useEffect : pour vérifier la session et charger les données au montage
//   - useRouter : pour rediriger vers /login si pas de session
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";


// ============================================================
// SECTION 1 : DONNÉES STATIQUES (ne changent pas)
// ============================================================

/** Éléments du menu de navigation dans la sidebar. */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",             actif: true,  icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",   actif: false, icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",      actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
];


// ============================================================
// SECTION 2 : FONCTION UTILITAIRE
// ============================================================

/**
 * Formate un nombre en format monétaire français.
 * On utilise l'API native Intl.NumberFormat pour un formatage propre.
 * Exemple : 45000 → "45 000 €"
 */
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

  /** Email de l'utilisateur connecté (récupéré depuis la session Supabase) */
  const [emailUtilisateur, setEmailUtilisateur] = useState("");

  /** Nombre total de contacts dans la table "contacts" */
  const [totalContacts, setTotalContacts] = useState(0);

  /** Nombre d'opportunités dont le statut est "À contacter" ou "En négociation" */
  const [opportunitesEnCours, setOpportunitesEnCours] = useState(0);

  /** Somme des montants de tous les deals qui ne sont pas "Perdu" */
  const [chiffreAffaires, setChiffreAffaires] = useState(0);

  /** Indicateur de chargement : true tant que les données n'ont pas été récupérées */
  const [chargement, setChargement] = useState(true);

  // ----------------------------------------------------------
  // HOOK DE NAVIGATION
  // ----------------------------------------------------------
  const router = useRouter();


  // ----------------------------------------------------------
  // useEffect : VÉRIFICATION DE SESSION + CHARGEMENT DES DONNÉES
  // ----------------------------------------------------------
  // Ce useEffect se lance UNE SEULE FOIS au montage du composant ([] vide).
  // Étapes :
  //   1. On vérifie si l'utilisateur a une session active (est-il connecté ?)
  //   2. Si NON → redirection vers /login
  //   3. Si OUI → on lance les 3 requêtes Supabase en parallèle

  useEffect(() => {
    async function verifierSessionEtChargerDonnees() {

      // ======================================================
      // ÉTAPE 1 : Vérifier la session utilisateur
      // ======================================================
      // supabase.auth.getSession() retourne un objet contenant
      // "session" (les infos de connexion) ou null si pas connecté.
      const { data: { session } } = await supabase.auth.getSession();

      // Si pas de session → l'utilisateur n'est pas connecté
      // On le redirige vers la page de login et on arrête tout.
      if (!session) {
        router.push("/login");
        return;
      }

      // On récupère l'email de l'utilisateur depuis sa session
      // pour l'afficher dans le header et le bandeau de bienvenue.
      setEmailUtilisateur(session.user.email ?? "");

      // ======================================================
      // ÉTAPE 2 : Lancer les 3 requêtes Supabase en parallèle
      // ======================================================
      // On utilise Promise.all pour exécuter les 3 requêtes EN MÊME TEMPS
      // au lieu de les faire une par une (= plus rapide).

      const [resultatContacts, resultatOpportunites, resultatDeals] = await Promise.all([

        // --------------------------------------------------
        // REQUÊTE 1 : Compter le nombre total de contacts
        // --------------------------------------------------
        // .from("contacts") → on cible la table "contacts"
        // .select("*", { count: "exact", head: true })
        //   - count: "exact" → Supabase calcule le nombre total de lignes
        //   - head: true → on ne récupère PAS les données, juste le comptage
        //   (= plus léger et plus rapide qu'un SELECT classique)
        // Grâce au RLS, seuls les contacts du user connecté sont comptés.
        supabase
          .from("contacts")
          .select("*", { count: "exact", head: true }),

        // --------------------------------------------------
        // REQUÊTE 2 : Compter les opportunités "en cours"
        // --------------------------------------------------
        // On veut uniquement les deals avec le statut :
        //   - "À contacter" OU "En négociation"
        // .in("status", [...]) filtre sur plusieurs valeurs possibles
        //   (c'est l'équivalent SQL de : WHERE status IN ('...', '...'))
        // head: true → on veut juste le nombre, pas les lignes.
        supabase
          .from("deals")
          .select("*", { count: "exact", head: true })
          .in("status", ["À contacter", "En négociation"]),

        // --------------------------------------------------
        // REQUÊTE 3 : Récupérer les montants des deals non perdus
        // --------------------------------------------------
        // Ici on récupère UNIQUEMENT la colonne "amount" de chaque deal
        // dont le statut N'EST PAS "Perdu".
        // .neq("status", "Perdu") → filtre : status ≠ "Perdu"
        //   (équivalent SQL : WHERE status != 'Perdu')
        // .select("amount") → on ne récupère que la colonne montant
        //   (pas besoin du titre ou du statut pour faire la somme)
        supabase
          .from("deals")
          .select("amount")
          .neq("status", "Perdu"),
      ]);

      // ======================================================
      // ÉTAPE 3 : Extraire et stocker les résultats
      // ======================================================

      // Résultat requête 1 : le comptage est dans ".count"
      // On utilise ?? 0 comme valeur par défaut si jamais c'est null.
      setTotalContacts(resultatContacts.count ?? 0);

      // Résultat requête 2 : même logique, le count est directement dispo
      setOpportunitesEnCours(resultatOpportunites.count ?? 0);

      // Résultat requête 3 : on a un tableau d'objets [{amount: 5000}, {amount: 12000}, ...]
      // On utilise .reduce() pour additionner tous les montants :
      //   - "somme" est l'accumulateur (commence à 0)
      //   - "deal.amount" est le montant de chaque deal
      //   - À chaque itération, on ajoute le montant à la somme
      const deals = resultatDeals.data ?? [];
      const somme = deals.reduce((somme, deal) => somme + (deal.amount ?? 0), 0);
      setChiffreAffaires(somme);

      // Toutes les données sont chargées → on masque le spinner
      setChargement(false);
    }

    // On appelle notre fonction async
    verifierSessionEtChargerDonnees();
  }, [router]);


  // ----------------------------------------------------------
  // FONCTION : Déconnexion
  // ----------------------------------------------------------
  // Appelle supabase.auth.signOut() pour détruire la session,
  // puis redirige vers la page de login.

  async function gererDeconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }


  // ----------------------------------------------------------
  // ÉTAT DE CHARGEMENT
  // ----------------------------------------------------------
  // Tant que "chargement" est true, on affiche un écran d'attente
  // au lieu du dashboard. Ça évite un "flash" de données vides.

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
  // On prend la partie avant le "@" de l'email pour un affichage convivial.
  // Exemple : "jean.dupont@mail.com" → "jean.dupont"
  const prenom = emailUtilisateur.split("@")[0];


  // ----------------------------------------------------------
  // RENDU JSX : Layout identique à la maquette validée
  // ----------------------------------------------------------

  return (
    // --- CONTENEUR GLOBAL : disposition en 2 colonnes (sidebar + contenu) ---
    <div className="flex h-full min-h-screen">

      {/* ======================================================== */}
      {/* SIDEBAR : Menu de navigation latéral gauche               */}
      {/* ======================================================== */}
      <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">

          {/* --- Logo / Nom de l'application --- */}
          <div className="px-6 py-5">
            <h1 className="text-xl font-bold text-indigo-600">OnBoarder</h1>
          </div>

          {/* --- Liste des liens de navigation --- */}
          {/* On parcourt le tableau "elementsNavigation" avec .map() */}
          {/* pour générer dynamiquement chaque lien du menu. */}
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
                    {/* Icône du lien — fichier à placer dans /public/ */}
                    <Image src={element.icone} alt={element.nom} width={20} height={20} />
                    {/* Texte du lien */}
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

        {/* ---------------------------------------------------- */}
        {/* HEADER : Barre supérieure avec titre + infos user      */}
        {/* ---------------------------------------------------- */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          {/* Titre de la page actuelle */}
          <h2 className="text-lg font-semibold text-gray-900">Tableau de bord</h2>

          {/* Informations de l'utilisateur connecté + bouton déconnexion */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {emailUtilisateur}
            </span>
            {/* Icône utilisateur (avatar placeholder) */}
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            {/* Bouton de déconnexion — appelle gererDeconnexion() au clic */}
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
          {/* Grille de 3 colonnes pour les KPI (indicateurs clés) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* --- Carte 1 : Total des contacts --- */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {/* Icône dans un cercle coloré */}
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/contacts.png" alt="Contacts" width={22} height={22} />
              </div>
              {/* Label de la statistique */}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total des contacts
              </p>
              {/* Valeur dynamique récupérée depuis Supabase */}
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalContacts}
              </p>
            </div>

            {/* --- Carte 2 : Opportunités en cours --- */}
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

            {/* --- Carte 3 : Chiffre d'affaires potentiel --- */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/dollar.png" alt="Chiffre d'affaires" width={22} height={22} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Chiffre d&apos;affaires potentiel
              </p>
              {/* Montant formaté via notre fonction utilitaire */}
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {formaterMontant(chiffreAffaires)}
              </p>
            </div>
          </div>

          {/* ================================================== */}
          {/* BANDEAU DE BIENVENUE                                 */}
          {/* ================================================== */}
          <div className="relative mt-8 overflow-hidden rounded-2xl bg-gray-100 p-8">
            {/* Texte de bienvenue (partie gauche) */}
            <div className="relative z-10 max-w-xl">
              <h3 className="text-2xl font-bold text-gray-900">
                Bienvenue, {prenom}.
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Vos indicateurs de performance sont à jour. L&apos;atelier de précision
                analyse vos données pour optimiser vos prochaines opportunités
                commerciales.
              </p>
            </div>

            {/* dégradé violet en arrière-plan à droite */}
            <div className="absolute right-0 top-0 h-full w-1/3 rounded-l-3xl bg-gradient-to-l from-indigo-200/80 via-indigo-100/50 to-transparent" />
          </div>

        </main>
      </div>
    </div>
  );
}
