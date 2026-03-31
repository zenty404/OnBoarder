// ============================================================
// PAGE PRINCIPALE : TABLEAU DE BORD (DASHBOARD)
// ============================================================


import Image from "next/image";


// ============================================================
// SECTION 1 : DONNÉES FICTIVES (MOCK DATA)
// ===========================================================

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

/** Éléments du menu de navigation dans la sidebar. */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/", actif: true, icone: "/icones/tableau-de-bord.svg" },
  { nom: "Entreprises", href: "/entreprises", actif: false, icone: "/icones/entreprises.svg" },
  { nom: "Contacts", href: "/contacts", actif: false, icone: "/icones/contacts.svg" },
  { nom: "Opportunités", href: "/opportunites", actif: false, icone: "/icones/opportunites.svg" },
];


// ============================================================
// SECTION 2 : FONCTION UTILITAIRE
// ============================================================

/**
 Formate un nombre en format monétaire français.
 On utilise l'API native Intl.NumberFormat pour un formatage propre.
 */
function formaterMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0, // Pas de centimes pour un affichage épuré
    maximumFractionDigits: 0,
  }).format(montant);
}


// ============================================================
// SECTION 3 : COMPOSANT PRINCIPAL DE LA PAGE
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
                      ${element.actif
                        ? "bg-indigo-50 text-indigo-600" /* Style actif : fond bleu clair + texte bleu */
                        : "text-gray-700 hover:bg-gray-100" /* Style inactif : texte gris + survol gris */
                      }
                    `}
                  >
                    {/* Icône du lien — fichier à placer dans /public/icones/ */}
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
              {utilisateur.nomComplet}
            </span>
            {/* Icône utilisateur (avatar placeholder) */}
            <Image src="/icones/utilisateur.svg" alt="Utilisateur" width={20} height={20} />
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
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/icones/personne-plus.svg" alt="Contacts" width={22} height={22} />
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
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/icones/tendance.svg" alt="Tendance" width={22} height={22} />
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
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <Image src="/icones/chiffre-affaires.svg" alt="Chiffre d'affaires" width={22} height={22} />
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

            {/* dégradé violet en arrière-plan à droite */}
            <div className="absolute right-0 top-0 h-full w-1/3 rounded-l-3xl bg-gradient-to-l from-indigo-200/80 via-indigo-100/50 to-transparent" />
          </div>

        </main>
      </div>
    </div>
  );
}
