// ============================================================
// PAGE : CONTACTS (Liste des contacts)
// ============================================================
// Cette page est désormais DYNAMIQUE : elle récupère les vraies
// données depuis la table "contacts" de Supabase.
//
// C'est un Client Component ("use client") car on utilise :
//   - useState  : pour stocker la liste des contacts, le formulaire, etc.
//   - useEffect : pour vérifier la session et charger les données au montage
//   - useRouter : pour rediriger vers /login si pas de session
//
// PARTICULARITÉ : le formulaire d'ajout de contact contient un
// menu déroulant (<select>) qui va chercher dynamiquement la liste
// des entreprises de l'utilisateur pour lier la clé étrangère company_id.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";


// ============================================================
// SECTION 1 : TYPES TYPESCRIPT
// ============================================================

/**
 * Type représentant un contact tel qu'il est stocké
 * dans la table "contacts" de Supabase.
 * Le champ "companies" est une jointure : quand on fait
 * .select("*, companies(name)"), Supabase ajoute un objet
 * "companies" contenant le nom de l'entreprise liée.
 */
type Contact = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_id: string;
  created_at: string;
  /** Objet joint contenant le nom de l'entreprise associée */
  companies: { name: string } | null;
};

/**
 * Type simplifié pour les entreprises, utilisé uniquement
 * dans le menu déroulant du formulaire d'ajout.
 */
type Entreprise = {
  id: string;
  name: string;
};


// ============================================================
// SECTION 2 : DONNÉES STATIQUES (navigation sidebar)
// ============================================================

/** Éléments du menu de navigation dans la sidebar. */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",              actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",   actif: false, icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",      actif: true,  icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
];


// ============================================================
// SECTION 3 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================

export default function PageContacts() {

  // ----------------------------------------------------------
  // ÉTATS LOCAUX (useState)
  // ----------------------------------------------------------

  /** Email de l'utilisateur connecté (récupéré depuis la session Supabase) */
  const [emailUtilisateur, setEmailUtilisateur] = useState("");

  /** Liste des contacts récupérés depuis Supabase (avec jointure entreprise) */
  const [contacts, setContacts] = useState<Contact[]>([]);

  /** Liste des entreprises de l'utilisateur (pour le menu déroulant du formulaire) */
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);

  /** Indicateur de chargement : true tant que les données n'ont pas été récupérées */
  const [chargement, setChargement] = useState(true);

  /** Contrôle l'affichage du formulaire d'ajout (visible ou masqué) */
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  /** Valeur du champ "Nom complet" dans le formulaire d'ajout */
  const [nouveauNom, setNouveauNom] = useState("");

  /** Valeur du champ "Email" dans le formulaire d'ajout */
  const [nouveauEmail, setNouveauEmail] = useState("");

  /** Valeur du champ "Téléphone" dans le formulaire d'ajout */
  const [nouveauTelephone, setNouveauTelephone] = useState("");

  /** ID de l'entreprise sélectionnée dans le menu déroulant */
  const [entrepriseSelectionnee, setEntrepriseSelectionnee] = useState("");

  // ----------------------------------------------------------
  // HOOK DE NAVIGATION
  // ----------------------------------------------------------
  const router = useRouter();


  // ----------------------------------------------------------
  // useEffect : VÉRIFICATION DE SESSION + CHARGEMENT DES DONNÉES
  // ----------------------------------------------------------
  // Ce useEffect se lance UNE SEULE FOIS au montage du composant ([] vide).
  // Étapes :
  //   1. On vérifie si l'utilisateur a une session active
  //   2. Si NON → redirection vers /login
  //   3. Si OUI → on récupère les contacts ET les entreprises en parallèle

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
      // pour l'afficher dans le header.
      setEmailUtilisateur(session.user.email ?? "");

      // ======================================================
      // ÉTAPE 2 : Récupérer contacts + entreprises EN PARALLÈLE
      // ======================================================
      // On utilise Promise.all pour exécuter les 2 requêtes EN MÊME TEMPS
      // au lieu de les faire une par une (= plus rapide).

      const [resultatContacts, resultatEntreprises] = await Promise.all([

        // --------------------------------------------------
        // REQUÊTE 1 : Récupérer tous les contacts avec jointure
        // --------------------------------------------------
        // .select("*, companies(name)") est une syntaxe Supabase
        // qui fait une JOINTURE automatique :
        //   - "*" → toutes les colonnes de "contacts"
        //   - "companies(name)" → ajoute le champ "name" de la table
        //     "companies" liée via la clé étrangère "company_id"
        // Résultat : chaque contact aura un objet "companies: { name: '...' }"
        //
        // .order("created_at", { ascending: false }) → tri par date
        // décroissante (les plus récents en premier).
        //
        // Grâce au RLS, seuls les contacts de l'utilisateur connecté
        // sont retournés.
        supabase
          .from("contacts")
          .select("*, companies(name)")
          .order("created_at", { ascending: false }),

        // --------------------------------------------------
        // REQUÊTE 2 : Récupérer la liste des entreprises
        // --------------------------------------------------
        // On récupère uniquement l'ID et le nom des entreprises
        // pour alimenter le menu déroulant (<select>) du formulaire.
        // .select("id, name") → on ne prend que ces 2 colonnes
        //   (pas besoin du site web ou du created_at ici)
        // .order("name") → tri alphabétique pour un menu propre
        supabase
          .from("companies")
          .select("id, name")
          .order("name"),
      ]);

      // On stocke les données récupérées dans nos états locaux.
      // Si "data" est null (erreur), on met un tableau vide.
      setContacts(resultatContacts.data ?? []);
      setEntreprises(resultatEntreprises.data ?? []);

      // Toutes les données sont chargées → on masque le spinner
      setChargement(false);
    }

    // On appelle notre fonction async
    verifierSessionEtChargerDonnees();
  }, [router]);


  // ----------------------------------------------------------
  // FONCTION : Ajouter un contact
  // ----------------------------------------------------------
  // Cette fonction est appelée quand l'utilisateur soumet le formulaire.
  // Étapes :
  //   1. Récupérer l'utilisateur connecté via getUser() pour avoir son ID
  //   2. Insérer une nouvelle ligne dans "contacts" avec le user_id
  //   3. Faire une requête de relecture pour avoir la jointure entreprise
  //   4. Ajouter le nouveau contact au state local

  async function ajouterContact() {
    // Vérification basique : le nom est obligatoire
    if (!nouveauNom.trim()) return;

    // ======================================================
    // SÉCURITÉ : Récupérer l'utilisateur courant
    // ======================================================
    // On utilise getUser() (et non getSession()) car c'est la méthode
    // recommandée pour obtenir l'identité vérifiée de l'utilisateur.
    // Le user_id est INDISPENSABLE pour le RLS : chaque ligne doit
    // être associée à son propriétaire.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ======================================================
    // INSERT : Créer le nouveau contact dans Supabase
    // ======================================================
    // .insert({...}) → insère une nouvelle ligne dans la table
    // .select("*, companies(name)") → retourne la ligne créée AVEC
    //   la jointure pour avoir le nom de l'entreprise directement
    // .single() → on attend une seule ligne en retour
    //
    // IMPORTANT : on passe explicitement "user_id: user.id" pour
    // garantir l'isolation des données entre utilisateurs (RLS).
    //
    // Note : company_id peut être null si aucune entreprise n'est
    // sélectionnée (le contact est alors "indépendant").
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        full_name: nouveauNom.trim(),
        email: nouveauEmail.trim(),
        phone: nouveauTelephone.trim(),
        company_id: entrepriseSelectionnee || null,
      })
      .select("*, companies(name)")
      .single();

    // Si l'insertion a réussi (pas d'erreur et data existe) :
    if (!error && data) {
      // On ajoute le nouveau contact EN TÊTE de la liste
      // (spread operator : [nouveau, ...anciens])
      setContacts([data, ...contacts]);

      // On réinitialise tous les champs du formulaire
      setNouveauNom("");
      setNouveauEmail("");
      setNouveauTelephone("");
      setEntrepriseSelectionnee("");

      // On ferme le formulaire d'ajout
      setFormulaireOuvert(false);
    }
  }


  // ----------------------------------------------------------
  // FONCTION : Supprimer un contact
  // ----------------------------------------------------------
  // Supprime un contact par son ID dans Supabase,
  // puis met à jour la liste locale en le filtrant.

  async function supprimerContact(id: string) {
    // ======================================================
    // DELETE : Supprimer la ligne dans Supabase
    // ======================================================
    // .from("contacts") → on cible la table "contacts"
    // .delete() → opération de suppression
    // .eq("id", id) → condition WHERE : on supprime uniquement
    //   la ligne dont l'ID correspond.
    // Grâce au RLS, un utilisateur ne peut supprimer QUE ses propres
    // contacts → pas besoin de vérifier le user_id côté front.
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    // Si la suppression a réussi, on met à jour l'état local
    // en filtrant le contact supprimé du tableau.
    // .filter() garde tous les contacts SAUF celui supprimé.
    if (!error) {
      setContacts(contacts.filter((c) => c.id !== id));
    }
  }


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
  // au lieu de la page. Ça évite un "flash" de données vides.

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Chargement de vos contacts…</p>
      </div>
    );
  }


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
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>

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
        {/* CONTENU PRINCIPAL : Formulaire + Grille de cartes      */}
        {/* ---------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ================================================== */}
          {/* BOUTON "AJOUTER UN CONTACT"                          */}
          {/* ================================================== */}
          {/* Au clic, on bascule l'état "formulaireOuvert" pour   */}
          {/* afficher ou masquer le formulaire d'ajout.            */}
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Ajouter un Contact
            </button>
          </div>

          {/* ================================================== */}
          {/* FORMULAIRE D'AJOUT (affiché conditionnellement)      */}
          {/* ================================================== */}
          {/* Ce bloc ne s'affiche que si "formulaireOuvert" est true.  */}
          {/* Il contient 4 champs : nom, email, téléphone, entreprise */}
          {/* Le champ "Entreprise" est un <select> dynamique qui va   */}
          {/* chercher les entreprises de l'utilisateur dans Supabase. */}
          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Nouveau contact
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* --- Champ : Nom complet du contact --- */}
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                {/* --- Champ : Email du contact --- */}
                <input
                  type="email"
                  placeholder="Email"
                  value={nouveauEmail}
                  onChange={(e) => setNouveauEmail(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                {/* --- Champ : Téléphone du contact --- */}
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={nouveauTelephone}
                  onChange={(e) => setNouveauTelephone(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                {/* --- Champ : Entreprise (menu déroulant dynamique) --- */}
                {/* Ce <select> est alimenté par la liste des entreprises */}
                {/* récupérée depuis Supabase au chargement de la page.   */}
                {/* La valeur sélectionnée est l'ID de l'entreprise       */}
                {/* (company_id) qui sera lié au contact en base.         */}
                <select
                  value={entrepriseSelectionnee}
                  onChange={(e) => setEntrepriseSelectionnee(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  {/* Option par défaut (aucune entreprise) */}
                  <option value="">-- Sélectionner une entreprise --</option>

                  {/* On parcourt la liste des entreprises pour générer les options */}
                  {entreprises.map((entreprise) => (
                    <option key={entreprise.id} value={entreprise.id}>
                      {entreprise.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* --- Boutons : Valider ou Annuler --- */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={ajouterContact}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Valider
                </button>
                <button
                  onClick={() => setFormulaireOuvert(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* GRILLE DES CARTES CONTACTS                            */}
          {/* ================================================== */}

          {/* Si aucun contact n'existe, on affiche un message */}
          {contacts.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aucun contact pour le moment. Ajoutez-en un !
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* On parcourt le tableau "contacts" avec .map()  */}
              {/* pour générer une carte par contact.              */}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  {/* --- Ligne du haut : icône + nom du contact --- */}
                  <div className="flex items-center gap-4">
                    <Image src="/user.png" alt="Contact" width={28} height={28} />
                    <h3 className="text-xl font-bold text-gray-900">
                      {contact.full_name}
                    </h3>
                  </div>

                  {/* --- Infos : Entreprise, email et téléphone --- */}
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-gray-500">
                      Entreprise : <span className="text-gray-700">
                        {/* On affiche le nom de l'entreprise via la jointure */}
                        {/* Si pas d'entreprise liée, on affiche "—" */}
                        {contact.companies?.name ?? "—"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Email : <span className="text-gray-700">{contact.email || "—"}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Téléphone : <span className="text-gray-700">{contact.phone || "—"}</span>
                    </p>
                  </div>

                  {/* --- Ligne du bas : bouton "Voir l'entreprise" + icône supprimer --- */}
                  <div className="mt-5 flex items-center justify-between">
                    {/* Bouton qui redirige vers la page Entreprises */}
                    <button
                      onClick={() => router.push("/entreprises")}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      Voir l&apos;entreprise
                    </button>

                    {/* Bouton supprimer — appelle supprimerContact() au clic */}
                    <button onClick={() => supprimerContact(contact.id)}>
                      <Image src="/delete.png" alt="Supprimer contact" width={24} height={24} />
                    </button>
                  </div>
                </div>
              ))}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
