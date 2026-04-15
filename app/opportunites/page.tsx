// PAGE OPPORTUNITÉS — Kanban dynamique avec Drag & Drop (Supabase)


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";


import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";


type Deal = {
  id: string;
  title: string;
  amount: number;
  status: string;
  contact_id: string;
  contacts: { full_name: string } | null; // jointure Supabase
};

type Contact = {
  id: string;
  full_name: string;
};


const elementsNavigation = [
    { nom: "Tableau de bord", href: "/",              actif: false, icone: "/dashbord.png" },
    { nom: "Entreprises",     href: "/entreprises",   actif: false, icone: "/entreprises.png" },
    { nom: "Contacts",        href: "/contacts",      actif: false,  icone: "/contacts.png" },
    { nom: "Opportunités",    href: "/opportunites",  actif: true, icone: "/opportunites.png" },
    { nom: "Ticket",          href: "/tickets",        actif: false, icone: "/opportunites.png" },

];


const ORDRE_COLONNES = ["À contacter", "En négociation", "Conclu", "Perdu"];

const COULEUR_STATUT: Record<string, string> = {
  "À contacter":    "bg-blue-400",
  "En négociation": "bg-yellow-400",
  "Conclu":         "bg-green-400",
  "Perdu":          "bg-red-400",
};


export default function PageOpportunites() {

  // États locaux
  const [emailUtilisateur, setEmailUtilisateur] = useState("");
  const [colonnes, setColonnes] = useState<Record<string, Deal[]>>({
    "À contacter": [], "En négociation": [], "Conclu": [], "Perdu": [],
  });
  const [listeContacts, setListeContacts] = useState<Contact[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState("");
  const [nouveauMontant, setNouveauMontant] = useState("");
  const [contactSelectionne, setContactSelectionne] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function verifierSessionEtChargerDonnees() {
      // Vérification session — redirige vers /login si pas connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setEmailUtilisateur(session.user.email ?? "");

      const [resultatDeals, resultatContacts] = await Promise.all([
        // Deals + jointure pour récupérer le nom du contact lié
        supabase.from("deals").select("*, contacts(full_name)").order("created_at"),
        // Contacts (id + full_name) pour le <select> du formulaire
        supabase.from("contacts").select("id, full_name").order("full_name"),
      ]);

      const deals: Deal[] = resultatDeals.data ?? [];
      const colonnesTriees: Record<string, Deal[]> = {
        "À contacter": [], "En négociation": [], "Conclu": [], "Perdu": [],
      };
      for (const deal of deals) {
        const cible = colonnesTriees[deal.status] ? deal.status : "À contacter";
        colonnesTriees[cible].push(deal);
      }

      setColonnes(colonnesTriees);
      setListeContacts(resultatContacts.data ?? []);
      setChargement(false);
    }

    verifierSessionEtChargerDonnees();
  }, [router]);

  
  async function gererFinDrag(result: DropResult) {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const colonneSrc  = [...colonnes[source.droppableId]];
    const colonneDest = source.droppableId === destination.droppableId
      ? colonneSrc
      : [...colonnes[destination.droppableId]];

    const [carteDeplacee] = colonneSrc.splice(source.index, 1);
    colonneDest.splice(destination.index, 0, carteDeplacee);

    setColonnes({
      ...colonnes,
      [source.droppableId]:      colonneSrc,
      [destination.droppableId]: colonneDest,
    });

    
    if (source.droppableId !== destination.droppableId) {
      await supabase
        .from("deals")
        .update({ status: destination.droppableId })
        .eq("id", carteDeplacee.id);
    }
  }

  async function ajouterOpportunite() {
    if (!nouveauTitre.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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

    if (!error && data) {
      setColonnes({ ...colonnes, "À contacter": [...colonnes["À contacter"], data] });
      setNouveauTitre("");
      setNouveauMontant("");
      setContactSelectionne("");
      setFormulaireOuvert(false);
    }
  }

  async function gererDeconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Chargement de vos opportunités…</p>
      </div>
    );
  }


  return (
    <div className="flex h-full min-h-screen">

      {/* SIDEBAR */}
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

      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Opportunités</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{emailUtilisateur}</span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button onClick={gererDeconnexion} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-auto p-8">

          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              + Ajouter une opportunité
            </button>
          </div>

          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Nouvelle opportunité</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Titre de l'opportunité"
                  value={nouveauTitre}
                  onChange={(e) => setNouveauTitre(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Montant (€)"
                  value={nouveauMontant}
                  onChange={(e) => setNouveauMontant(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <select
                  value={contactSelectionne}
                  onChange={(e) => setContactSelectionne(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Sélectionner un contact --</option>
                  {listeContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.full_name}</option>
                  ))}
                </select>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Statut initial : <span className="font-medium text-blue-500">À contacter</span>
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={ajouterOpportunite} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                  Valider
                </button>
                <button onClick={() => setFormulaireOuvert(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          )}

          <DragDropContext onDragEnd={gererFinDrag}>
            <div className="flex gap-5 items-start">
              {ORDRE_COLONNES.map((nomColonne) => (

                // Droppable = zone de dépôt (une colonne)
                // droppableId = nom du statut = clé dans l'objet colonnes
                <Droppable droppableId={nomColonne} key={nomColonne}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        flex w-64 flex-shrink-0 flex-col rounded-xl p-3
                        transition-colors duration-150
                        ${snapshot.isDraggingOver ? "bg-indigo-50" : "bg-gray-100"}
                      `}
                    >
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${COULEUR_STATUT[nomColonne]}`} />
                          <h3 className="text-sm font-semibold text-gray-700">{nomColonne}</h3>
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 shadow-sm">
                          {colonnes[nomColonne].length}
                        </span>
                      </div>

                      {/* Liste des cartes */}
                      <div className="flex flex-col gap-2">
                        {colonnes[nomColonne].map((deal, index) => (

                          // Draggable = carte déplaçable
                          // draggableId = id unique du deal, index = position dans la liste
                          <Draggable draggableId={deal.id} index={index} key={deal.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`
                                  rounded-lg bg-white p-4 transition-shadow duration-150
                                  ${snapshot.isDragging ? "shadow-lg rotate-1 opacity-90" : "shadow-sm hover:shadow-md"}
                                `}
                              >
                                <p className="text-sm font-semibold text-gray-800 leading-snug">{deal.title}</p>
                                {/* Nom du contact (jointure Supabase) */}
                                <p className="mt-1 text-xs text-gray-400">
                                  {deal.contacts?.full_name ?? "Aucun contact"}
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs font-bold text-indigo-600">
                                    {deal.amount.toLocaleString("fr-FR")} €
                                  </span>
                                  <span className="text-gray-300 select-none text-sm">⠿</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}

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
