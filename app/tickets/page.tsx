// ============================================================
// PAGE TICKETS — Système de support utilisateur
// L'utilisateur peut ouvrir un ticket avec un titre et un message.
// Les tickets sont stockés dans Supabase avec RLS (chaque user voit les siens).
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// ============================================================
// TYPE : structure d'un ticket
// ============================================================

type Ticket = {
  id: string;
  title: string;
  email: string;
  message: string;
  status: "Ouvert" | "Résolu" | "Fermé";
  created_at: string;
};

// ============================================================
// NAVIGATION LATÉRALE (sidebar)
// ============================================================

const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",             actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",  actif: false, icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",     actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites", actif: false, icone: "/opportunites.png" },
  { nom: "Ticket",          href: "/tickets",      actif: true,  icone: "/tickets.png" },
];

// ============================================================
// UTILITAIRE : couleur du badge selon le statut du ticket
// ============================================================

function couleurStatut(statut: string): string {
  switch (statut) {
    case "Ouvert":  return "bg-blue-100 text-blue-700";
    case "Résolu":  return "bg-green-100 text-green-700";
    case "Fermé":   return "bg-gray-100 text-gray-500";
    default:        return "bg-gray-100 text-gray-500";
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function PageTickets() {

  const [emailUtilisateur, setEmailUtilisateur] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const [nouveauTitre, setNouveauTitre] = useState("");
  const [nouveauMail, setNouveauEmail] = useState("");

  const [nouveauMessage, setNouveauMessage] = useState("");

  const router = useRouter();

  // ----------------------------------------------------------
  // Chargement initial : vérif session + récupération des tickets
  // ----------------------------------------------------------

  useEffect(() => {
    async function verifierSessionEtChargerTickets() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setEmailUtilisateur(session.user.email ?? "");

      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTickets(data as Ticket[]);
      }

      setChargement(false);
    }

    verifierSessionEtChargerTickets();
  }, [router]);

  // ----------------------------------------------------------
  // ACTION : Créer un nouveau ticket
  // ----------------------------------------------------------

  async function ajouterTicket() {
    if (!nouveauTitre.trim() || !nouveauMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        title: nouveauTitre.trim(),
        email: nouveauMail.trim(), 
        message: nouveauMessage.trim(),
      })
      .select("*")
      .single();

    if (!error && data) {
      setTickets((prev) => [data as Ticket, ...prev]);
      setNouveauTitre("");
      setNouveauMessage("");
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
        <p className="text-sm text-gray-500">Chargement des tickets…</p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDU PRINCIPAL
  // ----------------------------------------------------------

  return (
    <div className="flex h-full min-h-screen">

      {/* ======================================================
          SIDEBAR — Navigation latérale
      ====================================================== */}
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

      {/* ======================================================
          CONTENU PRINCIPAL
      ====================================================== */}
      <div className="flex flex-1 flex-col">

        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Mes Tickets</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{emailUtilisateur}</span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button
              onClick={gererDeconnexion}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">

          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              + Ouvrir un Ticket
            </button>
          </div>

          {/* ================================================
              FORMULAIRE — Création d'un ticket
          ================================================ */}
          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Nouveau Ticket</h3>
              <div className="flex flex-col gap-4">

                <input
                  type="text"
                  placeholder="Titre du ticket (ex: Problème de connexion)"
                  value={nouveauTitre}
                  onChange={(e) => setNouveauTitre(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Votre email"
                  value={nouveauMail}
                  onChange={(e) => setNouveauEmail(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />

                <textarea
                  placeholder="Décrivez votre demande ou problème en détail…"
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  rows={5}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={ajouterTicket}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Envoyer le ticket
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

          {/* ================================================
              LISTE DES TICKETS
          ================================================ */}
          {tickets.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aucun ticket pour le moment. Ouvrez-en un !
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold text-gray-900">{ticket.title}</h3>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${couleurStatut(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p >{ticket.email}</p>                  


                  <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{ticket.message}</p>

                  <p className="mt-4 text-xs text-gray-400">
                    Ouvert le{" "}
                    {new Date(ticket.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
