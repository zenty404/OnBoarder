// ============================================================
// PAGE : OPPORTUNITÉS (Tableau Kanban avec Drag & Drop)
// ============================================================
// Cette page est désormais DYNAMIQUE : elle récupère les vraies
// données depuis la table "deals" de Supabase et synchronise
// chaque déplacement de carte avec la base de données.
//
// C'est un Client Component ("use client") car on utilise :
//   - useState  : pour stocker les colonnes, le formulaire, etc.
//   - useEffect : pour vérifier la session et charger les données
//   - useRouter : pour rediriger vers /login si pas de session
//   - @hello-pangea/dnd : pour le Drag & Drop interactif
//
// FLUX DE DONNÉES :
//   1. Au montage → on fetch les deals + les contacts depuis Supabase
//   2. Les deals sont triés par statut dans 4 colonnes (Record)
//   3. Au drag & drop → mise à jour locale (UI) + UPDATE Supabase
//   4. À l'ajout → INSERT Supabase + ajout dans la colonne "À contacter"
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// ============================================================
// IMPORT @hello-pangea/dnd — les 3 briques du Drag & Drop
// ------------------------------------------------------------
// • DragDropContext : le "chef d'orchestre". Il enveloppe TOUT
//   le tableau Kanban et intercepte chaque événement DnD.
//   Son unique prop obligatoire est onDragEnd, appelé dès que
//   l'utilisateur lâche une carte.
//
// • Droppable : une "zone de dépôt". Ici chaque colonne du
//   Kanban est un Droppable. Il reçoit un droppableId unique
//   (ex: "À contacter") pour que onDragEnd sache où la carte
//   a été déposée.
//
// • Draggable : une "carte déplaçable". Chaque opportunité est
//   un Draggable. Il reçoit un draggableId unique et un index
//   (sa position dans la liste) pour permettre la réinsertion
//   à la bonne position.
// ============================================================
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";


// ============================================================
// SECTION 1 : TYPES TYPESCRIPT
// ============================================================

/**
 * Représente une opportunité commerciale (deal) telle qu'elle
 * est stockée dans Supabase + enrichie par la jointure contacts.
 *
 * Mapping avec la table "deals" :
 *   - id       → UUID auto-généré par Supabase
 *   - title    → Titre de l'opportunité
 *   - amount   → Montant estimé en euros
 *   - status   → Statut actuel (= nom de la colonne Kanban)
 *   - contacts → Objet joint contenant le nom du contact lié
 */
type Deal = {
  id: string;
  title: string;
  amount: number;
  status: string;
  contact_id: string;
  contacts: { full_name: string } | null;
};

/**
 * Type simplifié pour les contacts, utilisé uniquement
 * dans le menu déroulant du formulaire d'ajout.
 */
type Contact = {
  id: string;
  full_name: string;
};


// ============================================================
// SECTION 2 : CONSTANTES (navigation, couleurs, ordre)
// ============================================================

/** Éléments du menu de navigation dans la sidebar. */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",             actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",  actif: false, icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",     actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites", actif: true,  icone: "/opportunites.png" },
];

/** Ordre d'affichage des colonnes (de gauche à droite). */
const ORDRE_COLONNES = ["À contacter", "En négociation", "Conclu", "Perdu"];

/**
 * Couleur de l'indicateur de statut sur chaque carte.
 * On associe une couleur Tailwind à chaque statut.
 */
const COULEUR_STATUT: Record<string, string> = {
  "À contacter":    "bg-blue-400",
  "En négociation": "bg-yellow-400",
  "Conclu":         "bg-green-400",
  "Perdu":          "bg-red-400",
};


// ============================================================
// SECTION 3 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================

export default function PageOpportunites() {

  // ----------------------------------------------------------
  // ÉTATS LOCAUX (useState)
  // ----------------------------------------------------------

  /** Email de l'utilisateur connecté (récupéré depuis la session Supabase) */
  const [emailUtilisateur, setEmailUtilisateur] = useState("");

  /**
   * État du tableau Kanban : un objet (Record) dont :
   *   - les CLÉS sont les 4 statuts métier ("À contacter", etc.)
   *   - les VALEURS sont des tableaux de deals
   * Chaque tableau représente le contenu d'une colonne.
   * Initialisé avec des tableaux vides (remplis au fetch).
   */
  const [colonnes, setColonnes] = useState<Record<string, Deal[]>>({
    "À contacter":    [],
    "En négociation": [],
    "Conclu":         [],
    "Perdu":          [],
  });

  /** Liste des contacts de l'utilisateur (pour le menu déroulant du formulaire) */
  const [listeContacts, setListeContacts] = useState<Contact[]>([]);

  /** Indicateur de chargement : true tant que les données n'ont pas été récupérées */
  const [chargement, setChargement] = useState(true);

  /** Contrôle l'affichage du formulaire d'ajout (visible ou masqué) */
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  /** Valeur du champ "Titre" dans le formulaire d'ajout */
  const [nouveauTitre, setNouveauTitre] = useState("");

  /** Valeur du champ "Montant" dans le formulaire d'ajout */
  const [nouveauMontant, setNouveauMontant] = useState("");

  /** ID du contact sélectionné dans le menu déroulant */
  const [contactSelectionne, setContactSelectionne] = useState("");

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
  //   3. Si OUI → on récupère les deals ET les contacts en parallèle
  //   4. On organise les deals par statut dans l'objet "colonnes"

  useEffect(() => {
    async function verifierSessionEtChargerDonnees() {

      // ======================================================
      // ÉTAPE 1 : Vérifier la session utilisateur
      // ======================================================
      const { data: { session } } = await supabase.auth.getSession();

      // Si pas de session → redirection vers /login
      if (!session) {
        router.push("/login");
        return;
      }

      // On récupère l'email pour l'afficher dans le header
      setEmailUtilisateur(session.user.email ?? "");

      // ======================================================
      // ÉTAPE 2 : Récupérer deals + contacts EN PARALLÈLE
      // ======================================================
      // On utilise Promise.all pour exécuter les 2 requêtes EN MÊME TEMPS.

      const [resultatDeals, resultatContacts] = await Promise.all([

        // --------------------------------------------------
        // REQUÊTE 1 : Récupérer tous les deals avec jointure
        // --------------------------------------------------
        // .select("*, contacts(full_name)") → jointure automatique
        //   Supabase : on récupère toutes les colonnes de "deals"
        //   + le champ "full_name" de la table "contacts" liée
        //   via la clé étrangère "contact_id".
        //
        // .order("created_at") → tri chronologique pour garder
        //   l'ordre d'insertion dans chaque colonne.
        //
        // Grâce au RLS, seuls les deals de l'utilisateur connecté
        // sont retournés.
        supabase
          .from("deals")
          .select("*, contacts(full_name)")
          .order("created_at"),

        // --------------------------------------------------
        // REQUÊTE 2 : Récupérer la liste des contacts
        // --------------------------------------------------
        // On récupère uniquement l'ID et le nom complet des contacts
        // pour alimenter le menu déroulant (<select>) du formulaire.
        supabase
          .from("contacts")
          .select("id, full_name")
          .order("full_name"),
      ]);

      // ======================================================
      // ÉTAPE 3 : Organiser les deals par statut (colonnes)
      // ======================================================
      // On part d'un objet vide avec 4 tableaux vides,
      // puis on parcourt tous les deals reçus pour les répartir
      // dans la bonne colonne selon leur champ "status".
      //
      // Exemple : un deal avec status = "Conclu" est ajouté
      // au tableau colonnesTriees["Conclu"].

      const deals: Deal[] = resultatDeals.data ?? [];

      const colonnesTriees: Record<string, Deal[]> = {
        "À contacter":    [],
        "En négociation": [],
        "Conclu":         [],
        "Perdu":          [],
      };

      // On répartit chaque deal dans sa colonne
      for (const deal of deals) {
        // Vérification de sécurité : si le statut n'est pas reconnu,
        // on le met par défaut dans "À contacter"
        const colonneCible = colonnesTriees[deal.status] ? deal.status : "À contacter";
        colonnesTriees[colonneCible].push(deal);
      }

      // On met à jour l'état des colonnes et des contacts
      setColonnes(colonnesTriees);
      setListeContacts(resultatContacts.data ?? []);

      // Toutes les données sont chargées → on masque le spinner
      setChargement(false);
    }

    // On appelle notre fonction async
    verifierSessionEtChargerDonnees();
  }, [router]);


  // ----------------------------------------------------------
  // GESTIONNAIRE onDragEnd : le cœur du mécanisme DnD
  // ----------------------------------------------------------
  // Cette fonction est appelée automatiquement par la librairie
  // @hello-pangea/dnd dès que l'utilisateur relâche une carte.
  //
  // Le paramètre "result" (type DropResult) contient :
  //   result.draggableId  → l'id de la carte déplacée
  //   result.source       → { droppableId: "colonne source", index: position initiale }
  //   result.destination  → { droppableId: "colonne cible",  index: position finale }
  //                         (null si la carte est lâchée hors d'une zone valide)
  //
  // PRINCIPE GÉNÉRAL :
  //   1. On copie le tableau source, on retire la carte.
  //   2. On copie le tableau destination, on insère la carte.
  //   3. On met à jour l'état local → React re-rende → interface mise à jour.
  //   4. *** NOUVEAU *** On fait un UPDATE dans Supabase pour
  //      persister le changement de statut en base de données.
  // ----------------------------------------------------------

  async function gererFinDrag(result: DropResult) {

    const { source, destination } = result;

    // --- Cas 1 : carte lâchée hors d'une zone de dépôt valide ---
    // On ne fait rien, la carte retourne à sa position initiale.
    if (!destination) return;

    // --- Cas 2 : carte déposée exactement au même endroit ---
    // Même colonne ET même index → aucun changement nécessaire.
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // --- On récupère les tableaux des deux colonnes concernées ---
    const colonneSrc  = [...colonnes[source.droppableId]];
    const colonneDest = source.droppableId === destination.droppableId
      ? colonneSrc   // même colonne : on travaille sur la même référence
      : [...colonnes[destination.droppableId]];

    // --- On retire la carte de sa position source ---
    // splice(index, 1) retire 1 élément à l'index donné
    // et retourne un tableau contenant l'élément retiré.
    const [carteDeplacee] = colonneSrc.splice(source.index, 1);

    // --- On insère la carte à sa position de destination ---
    // splice(index, 0, element) insère sans retirer d'élément.
    colonneDest.splice(destination.index, 0, carteDeplacee);

    // --- On reconstruit l'état avec les colonnes mises à jour ---
    // On utilise le spread operator pour créer un nouvel objet
    // (React détecte le changement uniquement si la référence change).
    setColonnes({
      ...colonnes,
      [source.droppableId]:      colonneSrc,
      [destination.droppableId]: colonneDest,
    });

    // ======================================================
    // *** SYNCHRONISATION AVEC SUPABASE ***
    // ======================================================
    // Si la carte a changé de colonne (= changement de statut),
    // on persiste ce changement dans la base de données.
    //
    // .from("deals") → on cible la table "deals"
    // .update({ status: ... }) → on modifie uniquement la colonne "status"
    // .eq("id", ...) → condition WHERE : on cible le deal par son ID
    //
    // POURQUOI ON LE FAIT APRÈS le setState ?
    // → Pour une meilleure UX : l'interface se met à jour INSTANTANÉMENT
    //   (optimistic update), et la synchro base se fait en arrière-plan.
    //   Si l'UPDATE échoue, l'utilisateur pourra corriger en re-déplaçant.
    //
    // Le RLS garantit qu'un utilisateur ne peut modifier que SES propres deals.
    if (source.droppableId !== destination.droppableId) {
      await supabase
        .from("deals")
        .update({ status: destination.droppableId })
        .eq("id", carteDeplacee.id);
    }
  }


  // ----------------------------------------------------------
  // FONCTION : Ajouter une opportunité
  // ----------------------------------------------------------
  // Cette fonction est appelée quand l'utilisateur soumet le formulaire.
  // Étapes :
  //   1. Récupérer l'utilisateur connecté via getUser()
  //   2. Insérer un nouveau deal dans Supabase avec user_id
  //   3. Ajouter le deal dans la colonne "À contacter" (statut par défaut)

  async function ajouterOpportunite() {
    // Vérification basique : le titre est obligatoire
    if (!nouveauTitre.trim()) return;

    // ======================================================
    // SÉCURITÉ : Récupérer l'utilisateur courant
    // ======================================================
    // On utilise getUser() pour obtenir l'identité vérifiée.
    // Le user_id est INDISPENSABLE pour le RLS.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ======================================================
    // INSERT : Créer le nouveau deal dans Supabase
    // ======================================================
    // .insert({...}) → insère une nouvelle ligne dans la table "deals"
    // .select("*, contacts(full_name)") → retourne la ligne créée AVEC
    //   la jointure pour avoir le nom du contact directement
    // .single() → on attend une seule ligne en retour
    //
    // IMPORTANT : on passe explicitement "user_id: user.id" pour
    // garantir l'isolation des données entre utilisateurs (RLS).
    //
    // Le statut initial est TOUJOURS "À contacter" (première colonne).
    // Le montant est converti en nombre avec parseFloat (ou 0 si vide).
    const { data, error } = await supabase
      .from("deals")
      .insert({
        user_id: user.id,
        title: nouveauTitre.trim(),
        amount: parseFloat(nouveauMontant) || 0,
        contact_id: contactSelectionne || null,
        status: "À contacter",
      })
      .select("*, contacts(full_name)")
      .single();

    // Si l'insertion a réussi :
    if (!error && data) {
      // On ajoute le nouveau deal dans la colonne "À contacter"
      // en créant un nouvel objet colonnes (pour que React détecte le changement)
      setColonnes({
        ...colonnes,
        "À contacter": [...colonnes["À contacter"], data],
      });

      // On réinitialise les champs du formulaire
      setNouveauTitre("");
      setNouveauMontant("");
      setContactSelectionne("");

      // On ferme le formulaire
      setFormulaireOuvert(false);
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
        <p className="text-sm text-gray-500">Chargement de vos opportunités…</p>
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
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ---------------------------------------------------- */}
        {/* HEADER : Barre supérieure avec titre + infos user      */}
        {/* ---------------------------------------------------- */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Opportunités</h2>

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
        {/* CONTENU PRINCIPAL : Bouton + Formulaire + Kanban      */}
        {/* ---------------------------------------------------- */}
        <main className="flex-1 overflow-x-auto p-8">

          {/* ================================================== */}
          {/* BOUTON "AJOUTER UNE OPPORTUNITÉ"                    */}
          {/* ================================================== */}
          {/* Au clic, on bascule l'état "formulaireOuvert"       */}
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              + Ajouter une opportunité
            </button>
          </div>

          {/* ================================================== */}
          {/* FORMULAIRE D'AJOUT (affiché conditionnellement)      */}
          {/* ================================================== */}
          {/* Ce bloc ne s'affiche que si "formulaireOuvert" est true. */}
          {/* Il contient 3 champs : titre, montant, contact (select). */}
          {/* Le statut est automatiquement "À contacter".             */}
          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Nouvelle opportunité
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* --- Champ : Titre de l'opportunité --- */}
                <input
                  type="text"
                  placeholder="Titre de l'opportunité"
                  value={nouveauTitre}
                  onChange={(e) => setNouveauTitre(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                {/* --- Champ : Montant estimé --- */}
                <input
                  type="number"
                  placeholder="Montant (€)"
                  value={nouveauMontant}
                  onChange={(e) => setNouveauMontant(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                {/* --- Champ : Contact (menu déroulant dynamique) --- */}
                {/* Ce <select> est alimenté par la liste des contacts */}
                {/* récupérée depuis Supabase au chargement de la page. */}
                {/* La valeur sélectionnée est l'ID du contact (contact_id) */}
                {/* qui sera lié au deal en base.                          */}
                <select
                  value={contactSelectionne}
                  onChange={(e) => setContactSelectionne(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Sélectionner un contact --</option>
                  {listeContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* --- Info : statut par défaut --- */}
              <p className="mt-3 text-xs text-gray-400">
                Statut initial : <span className="font-medium text-blue-500">À contacter</span>
              </p>

              {/* --- Boutons : Valider ou Annuler --- */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={ajouterOpportunite}
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
          {/* TABLEAU KANBAN — DragDropContext                     */}
          {/* ================================================== */}
          {/*
            DragDropContext est le composant "racine" du système DnD.
            - Il écoute tous les événements de souris/tactile dans ses enfants.
            - onDragEnd est son unique prop obligatoire : c'est la fonction
              appelée à chaque fin de glissement, avec toutes les infos
              nécessaires (source, destination, identifiant de la carte).
            - IMPORTANT : il n'existe qu'un seul DragDropContext par
              tableau Kanban — il enveloppe TOUTES les colonnes.
          */}
          <DragDropContext onDragEnd={gererFinDrag}>
            <div className="flex gap-5 items-start">

              {/* On itère sur les 4 colonnes dans l'ordre défini */}
              {ORDRE_COLONNES.map((nomColonne) => (

                // ============================================
                // COLONNE KANBAN — Droppable
                // ============================================
                // Droppable délimite une zone où les cartes
                // peuvent être déposées.
                //
                // Props clés :
                //   droppableId : identifiant unique de la zone.
                //     Ici on utilise le nom du statut directement
                //     (ex: "À contacter") car c'est aussi la clé
                //     de notre objet "colonnes" ET la valeur du
                //     champ "status" en base de données.
                //
                // Droppable utilise le pattern "render prop" :
                //   il appelle ses enfants comme une fonction
                //   en leur passant deux arguments :
                //     - provided : refs, props à appliquer sur le DOM
                //     - snapshot : état en temps réel du drag
                //       (ex: isDraggingOver = true si une carte
                //        survole la zone)
                // ============================================
                <Droppable droppableId={nomColonne} key={nomColonne}>
                  {(provided, snapshot) => (
                    <div
                      // ref obligatoire : @hello-pangea/dnd en a besoin
                      // pour mesurer la position de la colonne dans le DOM
                      ref={provided.innerRef}
                      // ...provided.droppableProps ajoute les attributs
                      // data-* nécessaires au tracking interne de la lib
                      {...provided.droppableProps}
                      className={`
                        flex w-64 flex-shrink-0 flex-col rounded-xl p-3
                        transition-colors duration-150
                        ${snapshot.isDraggingOver
                          ? "bg-indigo-50"   // légère teinte si une carte survole
                          : "bg-gray-100"    // fond neutre par défaut
                        }
                      `}
                    >
                      {/* --- En-tête de la colonne --- */}
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          {/* Indicateur coloré selon le statut */}
                          <span className={`h-2.5 w-2.5 rounded-full ${COULEUR_STATUT[nomColonne]}`} />
                          <h3 className="text-sm font-semibold text-gray-700">
                            {nomColonne}
                          </h3>
                        </div>
                        {/* Compteur de deals dans la colonne */}
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 shadow-sm">
                          {colonnes[nomColonne].length}
                        </span>
                      </div>

                      {/* --- Liste des cartes de la colonne --- */}
                      <div className="flex flex-col gap-2">
                        {colonnes[nomColonne].map((deal, index) => (

                          // ======================================
                          // CARTE D'OPPORTUNITÉ — Draggable
                          // ======================================
                          // Draggable rend un élément "saisissable"
                          // par l'utilisateur.
                          //
                          // Props clés :
                          //   draggableId : identifiant unique
                          //     de la carte (doit être une string).
                          //   index : position de la carte dans
                          //     sa liste actuelle. La librairie
                          //     l'utilise pour calculer où insérer
                          //     la carte lors du dépôt.
                          //
                          // Comme Droppable, Draggable utilise
                          // le pattern "render prop" avec :
                          //   - provided : refs + dragHandleProps
                          //     (à appliquer sur l'élément draggable)
                          //   - snapshot : isDragging = true pendant
                          //     le glissement
                          // ======================================
                          <Draggable
                            draggableId={deal.id}
                            index={index}
                            key={deal.id}
                          >
                            {(provided, snapshot) => (
                              <div
                                // ref obligatoire : la lib suit la position
                                // de cet élément dans le DOM en temps réel
                                ref={provided.innerRef}
                                // ...provided.draggableProps : style de
                                // positionnement calculé par la librairie
                                // (transform, transition) appliqué pendant le drag
                                {...provided.draggableProps}
                                // ...provided.dragHandleProps : active la
                                // poignée de drag sur cet élément
                                // (cursor:grab, aria-grabbed, etc.)
                                {...provided.dragHandleProps}
                                className={`
                                  rounded-lg bg-white p-4
                                  transition-shadow duration-150
                                  ${snapshot.isDragging
                                    ? "shadow-lg rotate-1 opacity-90" // effet visuel pendant le drag
                                    : "shadow-sm hover:shadow-md"
                                  }
                                `}
                              >
                                {/* Titre du deal */}
                                <p className="text-sm font-semibold text-gray-800 leading-snug">
                                  {deal.title}
                                </p>

                                {/* Nom du contact associé (via la jointure Supabase) */}
                                <p className="mt-1 text-xs text-gray-400">
                                  {deal.contacts?.full_name ?? "Aucun contact"}
                                </p>

                                {/* Séparateur + Montant */}
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs font-bold text-indigo-600">
                                    {deal.amount.toLocaleString("fr-FR")} €
                                  </span>
                                  {/* Petite poignée visuelle */}
                                  <span className="text-gray-300 select-none text-sm">⠿</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {/*
                          provided.placeholder est OBLIGATOIRE.
                          Pendant le drag, la librairie retire visuellement
                          la carte de la liste. Le placeholder maintient
                          l'espace occupé pour que la colonne ne "saute" pas
                          et que le calcul de la position de dépôt soit correct.
                        */}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>

        </main>
      </div>
    </div>
  );
}
