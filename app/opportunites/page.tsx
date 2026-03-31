// ============================================================
// DIRECTIVE CLIENT : obligatoire car on utilise useState et
// des gestionnaires d'événements (drag & drop).
// Sans ce mot-clé, Next.js traite le fichier comme un
// Server Component et refuse useState.
// ============================================================
"use client";

import Image from "next/image";
import { useState } from "react";

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
// SECTION 1 : TYPES & DONNÉES FICTIVES (MOCK DATA)
// ============================================================

/** Représente une opportunité commerciale (deal). */
type Deal = {
  id: string;         // Identifiant unique de la carte
  titre: string;      // Titre de l'opportunité
  montant: number;    // Montant estimé en euros
  contact: string;    // Nom du contact associé
};

/**
 * État initial du tableau Kanban.
 * C'est un objet (Record) dont :
 *   - les CLÉS sont exactement les 4 statuts métier
 *   - les VALEURS sont des tableaux de deals
 *
 * Chaque tableau représente le contenu d'une colonne.
 */
const donneesInitiales: Record<string, Deal[]> = {
  "À contacter": [
    { id: "deal-1", titre: "Site vitrine TechVision",    montant: 2400,  contact: "Marie Laurent" },
    { id: "deal-2", titre: "Refonte logo DataSoft",      montant: 800,   contact: "Pierre Martin" },
    { id: "deal-3", titre: "Audit SEO GreenLeaf",        montant: 1200,  contact: "Sophie Durand" },
  ],
  "En négociation": [
    { id: "deal-4", titre: "Application mobile CloudNine", montant: 8500, contact: "Lucas Bernard" },
    { id: "deal-5", titre: "Dashboard analytics Neopix",  montant: 3600, contact: "Clara Petit" },
  ],
  "Conclu": [
    { id: "deal-6", titre: "E-commerce Maison Fleury",   montant: 5200,  contact: "Antoine Moreau" },
    { id: "deal-7", titre: "Intégration API Banque LCO", montant: 4100,  contact: "Lucie Simon" },
  ],
  "Perdu": [
    { id: "deal-8", titre: "Chatbot support Axo Group",  montant: 2900,  contact: "Nicolas Roy" },
  ],
};

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
// SECTION 2 : DONNÉES DE NAVIGATION & UTILISATEUR
// ============================================================

/** Informations de l'utilisateur connecté (simulé). */
const utilisateur = {
  nomComplet: "Jean Dupont",
};

/** Éléments du menu de navigation dans la sidebar. */
const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",             actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",  actif: false, icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",     actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites", actif: true,  icone: "/opportunites.png" },
];

// ============================================================
// SECTION 3 : COMPOSANT PRINCIPAL DE LA PAGE
// ============================================================

export default function PageOpportunites() {

  // ----------------------------------------------------------
  // ÉTAT LOCAL : colonnes du Kanban
  // ----------------------------------------------------------
  // On stocke les colonnes dans un useState pour que React
  // re-rende le composant après chaque déplacement de carte.
  // "colonnes" est une copie mutable de donneesInitiales.
  // ----------------------------------------------------------
  const [colonnes, setColonnes] = useState<Record<string, Deal[]>>(donneesInitiales);

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
  //   3. On met à jour l'état → React re-rende → interface mise à jour.
  // ----------------------------------------------------------
  function gererFinDrag(result: DropResult) {

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
  }

  // ----------------------------------------------------------
  // RENDU JSX
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
              {utilisateur.nomComplet}
            </span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Déconnexion
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* CONTENU PRINCIPAL : Bouton + Tableau Kanban            */}
        {/* ---------------------------------------------------- */}
        <main className="flex-1 overflow-x-auto p-8">

          {/* ================================================== */}
          {/* BOUTON "AJOUTER UNE OPPORTUNITÉ"                    */}
          {/* ================================================== */}
          <div className="mb-8 flex justify-end">
            <button className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
              + Ajouter une opportunité
            </button>
          </div>

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
                //     de notre objet "colonnes".
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
                                  {deal.titre}
                                </p>

                                {/* Contact associé */}
                                <p className="mt-1 text-xs text-gray-400">
                                  {deal.contact}
                                </p>

                                {/* Séparateur + Montant */}
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs font-bold text-indigo-600">
                                    {deal.montant.toLocaleString("fr-FR")} €
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
