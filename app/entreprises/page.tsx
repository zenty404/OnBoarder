// ============================================================
// PAGE : ENTREPRISES (Liste des entreprises clientes)
// ============================================================

import Image from "next/image";

// ============================================================
// SECTION 1 : DONNÉES FICTIVES (MOCK DATA)
// ============================================================


/** Informations de l'utilisateur connecté (simulé) */
const utilisateur = {
  nomComplet: "Jean Dupont",
  prenom: "Jean",
};

/**Liste des entreprises fictives.*/
const entreprises = [
  { id: "1", nom: "TechVision",   siteWeb: "www.techvision.fr",   contactNom: "Marie Laurent" },
  { id: "2", nom: "DataSoft",     siteWeb: "www.datasoft.io",     contactNom: "Pierre Martin" },
  { id: "3", nom: "GreenLeaf",    siteWeb: "www.greenleaf.com",   contactNom: "Sophie Durand" },
  { id: "4", nom: "CloudNine",    siteWeb: "www.cloudnine.fr",    contactNom: "Lucas Bernard" },
];

/**Éléments du menu de navigation dans la sidebar.*/
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",              actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",   actif: true,  icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",      actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
];


// ============================================================
// SECTION 2 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================

export default function PageEntreprises() {
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
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100"
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
      {/* ZONE PRINCIPALE : Header + Contenu                        */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col">

        {/* ---------------------------------------------------- */}
        {/* HEADER : Barre supérieure avec titre + infos user      */}
        {/* ---------------------------------------------------- */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Entreprises</h2>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {utilisateur.nomComplet}
            </span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Déconnexion
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* CONTENU PRINCIPAL : Bouton + Grille de cartes          */}
        {/* ---------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ================================================== */}
          {/* BOUTON "AJOUTER UNE ENTREPRISE"                      */}
          {/* ================================================== */}
          <div className="mb-8 flex justify-end">
            <button className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
              Ajouter une Entreprise
            </button>
          </div>

          {/* ================================================== */}
          {/* GRILLE DES CARTES ENTREPRISES                         */}
          {/* ================================================== */}
          
          {/* icône email.                                          */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* On parcourt le tableau "entreprises" avec .map()  */}
            {/* pour générer une carte par entreprise.              */}
            {entreprises.map((entreprise) => (
              <div
                key={entreprise.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                {/* --- Ligne du haut : icône + nom de l'entreprise --- */}
                <div className="flex items-center gap-4">
                  <Image src="/entreprises.png" alt="Entreprise" width={28} height={28} />
                  <h3 className="text-xl font-bold text-gray-900">
                    {entreprise.nom}
                  </h3>
                </div>

                {/* --- Infos : site web et contact associé --- */}
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-500">
                    Site Web : <span className="text-gray-700">{entreprise.siteWeb}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Contact : <span className="text-gray-700">{entreprise.contactNom}</span>
                  </p>
                </div>

                {/* --- Ligne du bas : bouton "Contacter" + icône email --- */}
                <div className="mt-5 flex items-center justify-between">
                  {/* Bouton contacter (visuel uniquement) */}
                  <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                    Contacter
                  </button>

                  {/* Icône email — fichier à placer dans /public/icones/ */}
                  <Image src="/icones/email.svg" alt="Envoyer un email" width={24} height={24} />
                </div>
              </div>
            ))}

          </div>
        </main>
      </div>
    </div>
  );
}
