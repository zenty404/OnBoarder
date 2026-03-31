// ============================================================
// PAGE PRINCIPALE : TABLEAU DE BORD (DASHBOARD)
// ============================================================
// Ce fichier est la page d'accueil du mini-CRM "OnBoarder".
//
// IMPORTANT : Pour le moment, toutes les données affichées sont
// des données fictives (mock data) définies en dur ci-dessous.
// Aucune connexion à Supabase n'est effectuée.
// Le but est d'avoir un rendu visuel fidèle à la maquette.
//
// Structure de la page :
//   1. Sidebar (menu latéral gauche) avec la navigation
//   2. Zone principale avec :
//      a. Un header (barre du haut) avec le titre et l'utilisateur
//      b. Les cartes de statistiques (contacts, opportunités, CA)
//      c. Un bandeau de bienvenue personnalisé
// ============================================================


// ============================================================
// SECTION 1 : DONNÉES FICTIVES (MOCK DATA)
// ============================================================
// Ces données simulent ce qu'on récupérerait normalement depuis
// la base de données Supabase. Elles sont placées ici en haut
// du fichier pour être facilement modifiables lors de la soutenance.
// ============================================================

/** Informations de l'utilisateur connecté (simulé) */
const utilisateur = {
  nomComplet: "Jean Dupont",
  prenom: "Jean",
};

/** Statistiques affichées sur les cartes du dashboard */
const statistiques = {
  totalContacts: 124,
  opportunitesEnCours: 12,
  chiffreAffairesPotentiel: 45000,
};

/** Éléments du menu de navigation dans la sidebar */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/", actif: true },
  { nom: "Entreprises", href: "/entreprises", actif: false },
  { nom: "Contacts", href: "/contacts", actif: false },
  { nom: "Opportunités", href: "/opportunites", actif: false },
];


// ============================================================
// SECTION 2 : COMPOSANTS D'ICÔNES SVG
// ============================================================
// Chaque icône est un petit composant React qui retourne un SVG.
// On les sépare ici pour garder le JSX principal propre et lisible.
// Les icônes sont inspirées du style de la maquette (trait fin, style ligne).
// ============================================================

/** Icône "grille" pour le menu Tableau de bord */
function IconeTableauDeBord() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/** Icône "immeuble" pour le menu Entreprises */
function IconeEntreprises() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

/** Icône "personnes" pour le menu Contacts */
function IconeContacts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Icône "diamant" pour le menu Opportunités */
function IconeOpportunites() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M11 3l1 6h8" />
      <path d="M2 9h20" />
      <path d="M13 3l-1 6H4" />
    </svg>
  );
}

/** Icône "personne +" pour la carte Total des Contacts */
function IconePersonnePlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

/** Icône "courbe montante" pour la carte Opportunités en cours */
function IconeTendance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

/** Icône "billet / portefeuille" pour la carte Chiffre d'affaires */
function IconeChiffreAffaires() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </svg>
  );
}

/** Icône "utilisateur" pour le header (à côté du nom) */
function IconeUtilisateur() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}


// ============================================================
// SECTION 3 : FONCTION UTILITAIRE
// ============================================================

/**
 * Formate un nombre en format monétaire français.
 * Exemple : 45000 → "45 000 €"
 * On utilise l'API native Intl.NumberFormat pour un formatage propre.
 */
function formaterMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0, // Pas de centimes pour un affichage épuré
    maximumFractionDigits: 0,
  }).format(montant);
}

/**
 * Retourne l'icône SVG correspondant au nom de l'élément de navigation.
 * Cela permet de garder le JSX de la sidebar propre et lisible.
 */
function getIconeNavigation(nomElement: string) {
  switch (nomElement) {
    case "Tableau de bord":
      return <IconeTableauDeBord />;
    case "Entreprises":
      return <IconeEntreprises />;
    case "Contacts":
      return <IconeContacts />;
    case "Opportunités":
      return <IconeOpportunites />;
    default:
      return null;
  }
}


// ============================================================
// SECTION 4 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================
// C'est le composant exporté par défaut. Next.js l'affiche
// automatiquement quand l'utilisateur visite la route "/".
// ============================================================

export default function PageTableauDeBord() {
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
                      ${
                        element.actif
                          ? "bg-indigo-50 text-indigo-600" /* Style actif : fond bleu clair + texte bleu */
                          : "text-gray-700 hover:bg-gray-100" /* Style inactif : texte gris + survol gris */
                      }
                    `}
                  >
                    {/* Icône du lien (récupérée via la fonction utilitaire) */}
                    {getIconeNavigation(element.nom)}
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
              {utilisateur.nomComplet}
            </span>
            {/* Icône utilisateur (avatar placeholder) */}
            <span className="text-gray-500">
              <IconeUtilisateur />
            </span>
            {/* Lien de déconnexion (non fonctionnel pour le moment) */}
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
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
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <IconePersonnePlus />
              </div>
              {/* Label de la statistique */}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total des contacts
              </p>
              {/* Valeur numérique (grande et en gras) */}
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {statistiques.totalContacts}
              </p>
            </div>

            {/* --- Carte 2 : Opportunités en cours --- */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <IconeTendance />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Opportunités en cours
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {statistiques.opportunitesEnCours}
              </p>
            </div>

            {/* --- Carte 3 : Chiffre d'affaires potentiel --- */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <IconeChiffreAffaires />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Chiffre d&apos;affaires potentiel
              </p>
              {/* Montant formaté via notre fonction utilitaire */}
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {formaterMontant(statistiques.chiffreAffairesPotentiel)}
              </p>
            </div>
          </div>

          {/* ================================================== */}
          {/* BANDEAU DE BIENVENUE                                 */}
          {/* ================================================== */}
          {/* Carte large sous les statistiques avec un message    */}
          {/* personnalisé et un dégradé décoratif à droite.       */}
          <div className="relative mt-8 overflow-hidden rounded-2xl bg-gray-100 p-8">
            {/* Texte de bienvenue (partie gauche) */}
            <div className="relative z-10 max-w-xl">
              <h3 className="text-2xl font-bold text-gray-900">
                Bienvenue, {utilisateur.prenom}.
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Vos indicateurs de performance sont à jour. L&apos;atelier de précision
                analyse vos données pour optimiser vos prochaines opportunités
                commerciales.
              </p>
            </div>

            {/* Décoration : dégradé violet en arrière-plan à droite */}
            {/* C'est un élément purement visuel, sans contenu fonctionnel. */}
            <div className="absolute right-0 top-0 h-full w-1/3 rounded-l-3xl bg-gradient-to-l from-indigo-200/80 via-indigo-100/50 to-transparent" />
          </div>

        </main>
      </div>
    </div>
  );
}
