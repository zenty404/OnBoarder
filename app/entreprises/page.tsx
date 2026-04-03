// ============================================================
// PAGE : ENTREPRISES (Liste des entreprises clientes)
// ============================================================
// Cette page est désormais DYNAMIQUE : elle récupère les vraies
// données depuis la table "companies" de Supabase.
//
// C'est un Client Component ("use client") car on utilise :
//   - useState  : pour stocker la liste des entreprises, le formulaire, etc.
//   - useEffect : pour vérifier la session et charger les données au montage
//   - useRouter : pour rediriger vers /login si pas de session
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
 * Type représentant une entreprise telle qu'elle est stockée
 * dans la table "companies" de Supabase.
 * Chaque champ correspond à une colonne de la table.
 */
type Entreprise = {
  id: string;
  name: string;
  website: string;
  created_at: string;
};


// ============================================================
// SECTION 2 : DONNÉES STATIQUES (navigation sidebar)
// ============================================================

/** Éléments du menu de navigation dans la sidebar. */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",              actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",   actif: true,  icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",      actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
];


// ============================================================
// SECTION 3 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================

export default function PageEntreprises() {

  // ----------------------------------------------------------
  // ÉTATS LOCAUX (useState)
  // ----------------------------------------------------------

  /** Email de l'utilisateur connecté (récupéré depuis la session Supabase) */
  const [emailUtilisateur, setEmailUtilisateur] = useState("");

  /** Liste des entreprises récupérées depuis Supabase */
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);

  /** Indicateur de chargement : true tant que les données n'ont pas été récupérées */
  const [chargement, setChargement] = useState(true);

  /** Contrôle l'affichage du formulaire d'ajout (visible ou masqué) */
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  /** Valeur du champ "Nom" dans le formulaire d'ajout */
  const [nouveauNom, setNouveauNom] = useState("");

  /** Valeur du champ "Site Web" dans le formulaire d'ajout */
  const [nouveauSiteWeb, setNouveauSiteWeb] = useState("");

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
  //   3. Si OUI → on récupère la liste des entreprises depuis Supabase

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
      // ÉTAPE 2 : Récupérer la liste des entreprises
      // ======================================================
      // .from("companies") → on cible la table "companies"
      // .select("*") → on récupère toutes les colonnes
      // .order("created_at", { ascending: false }) → tri par date décroissante
      //   (les plus récentes en premier)
      // Grâce au RLS (Row Level Security) configuré dans Supabase,
      // seules les entreprises appartenant à l'utilisateur connecté
      // sont retournées automatiquement.
      const { data } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      // On stocke les données récupérées dans notre état local.
      // Si "data" est null (erreur), on met un tableau vide.
      setEntreprises(data ?? []);

      // Toutes les données sont chargées → on masque le spinner
      setChargement(false);
    }

    // On appelle notre fonction async
    verifierSessionEtChargerDonnees();
  }, [router]);


  // ----------------------------------------------------------
  // FONCTION : Ajouter une entreprise
  // ----------------------------------------------------------
  // Cette fonction est appelée quand l'utilisateur soumet le formulaire.
  // Étapes :
  //   1. Récupérer l'utilisateur connecté via getUser() pour avoir son ID
  //   2. Insérer une nouvelle ligne dans "companies" avec le user_id
  //   3. Ajouter la nouvelle entreprise au state local pour mise à jour immédiate

  async function ajouterEntreprise() {
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
    // INSERT : Créer la nouvelle entreprise dans Supabase
    // ======================================================
    // .insert({...}) → insère une nouvelle ligne dans la table
    // .select() → retourne la ligne qui vient d'être créée
    //   (utile pour récupérer l'ID auto-généré et le created_at)
    // .single() → on attend une seule ligne en retour
    //
    // IMPORTANT : on passe explicitement "user_id: user.id" pour
    // garantir l'isolation des données entre utilisateurs (RLS).
    const { data, error } = await supabase
      .from("companies")
      .insert({
        user_id: user.id,
        name: nouveauNom.trim(),
        website: nouveauSiteWeb.trim(),
      })
      .select()
      .single();

    // Si l'insertion a réussi (pas d'erreur et data existe) :
    if (!error && data) {
      // On ajoute la nouvelle entreprise EN TÊTE de la liste
      // (spread operator : [nouvelle, ...anciennes])
      setEntreprises([data, ...entreprises]);

      // On réinitialise les champs du formulaire
      setNouveauNom("");
      setNouveauSiteWeb("");

      // On ferme le formulaire d'ajout
      setFormulaireOuvert(false);
    }
  }


  // ----------------------------------------------------------
  // FONCTION : Supprimer une entreprise
  // ----------------------------------------------------------
  // Supprime une entreprise par son ID dans Supabase,
  // puis met à jour la liste locale en la filtrant.

  async function supprimerEntreprise(id: string) {
    // ======================================================
    // DELETE : Supprimer la ligne dans Supabase
    // ======================================================
    // .from("companies") → on cible la table "companies"
    // .delete() → opération de suppression
    // .eq("id", id) → condition WHERE : on supprime uniquement
    //   la ligne dont l'ID correspond.
    // Grâce au RLS, un utilisateur ne peut supprimer QUE ses propres
    // entreprises → pas besoin de vérifier le user_id côté front.
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    // Si la suppression a réussi, on met à jour l'état local
    // en filtrant l'entreprise supprimée du tableau.
    // .filter() garde toutes les entreprises SAUF celle supprimée.
    if (!error) {
      setEntreprises(entreprises.filter((e) => e.id !== id));
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
        <p className="text-sm text-gray-500">Chargement de vos entreprises…</p>
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
          <h2 className="text-lg font-semibold text-gray-900">Entreprises</h2>

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
          {/* BOUTON "AJOUTER UNE ENTREPRISE"                      */}
          {/* ================================================== */}
          {/* Au clic, on bascule l'état "formulaireOuvert" pour   */}
          {/* afficher ou masquer le formulaire d'ajout.            */}
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Ajouter une Entreprise
            </button>
          </div>

          {/* ================================================== */}
          {/* FORMULAIRE D'AJOUT (affiché conditionnellement)      */}
          {/* ================================================== */}
          {/* Ce bloc ne s'affiche que si "formulaireOuvert" est true. */}
          {/* Il contient 2 champs (nom + site web) et un bouton     */}
          {/* pour valider l'insertion dans Supabase.                  */}
          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Nouvelle entreprise
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* --- Champ : Nom de l'entreprise --- */}
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                {/* --- Champ : Site web de l'entreprise --- */}
                <input
                  type="text"
                  placeholder="Site web (ex: www.exemple.fr)"
                  value={nouveauSiteWeb}
                  onChange={(e) => setNouveauSiteWeb(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* --- Boutons : Valider ou Annuler --- */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={ajouterEntreprise}
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
          {/* GRILLE DES CARTES ENTREPRISES                         */}
          {/* ================================================== */}

          {/* Si aucune entreprise n'existe, on affiche un message */}
          {entreprises.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aucune entreprise pour le moment. Ajoutez-en une !
            </p>
          ) : (
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
                      {entreprise.name}
                    </h3>
                  </div>

                  {/* --- Infos : site web --- */}
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-gray-500">
                      Site Web : <span className="text-gray-700">{entreprise.website || "—"}</span>
                    </p>
                  </div>

                  {/* --- Ligne du bas : bouton "Contacter" + icône supprimer --- */}
                  <div className="mt-5 flex items-center justify-between">
                    {/* Bouton contacter (visuel uniquement) */}
                    <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                      Contacter
                    </button>

                    {/* Bouton supprimer — appelle supprimerEntreprise() au clic */}
                    <button onClick={() => supprimerEntreprise(entreprise.id)}>
                      <Image src="/delete.png" alt="Supprimer entreprise" width={24} height={24} />
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
