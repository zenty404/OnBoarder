// ============================================================
// PAGE ADMIN — Gestion des tickets de support
//
// Accès : réservé aux utilisateurs connectés (admin).
// L'admin voit UNIQUEMENT ses propres tickets (RLS filtre
// sur user_id = auth.uid()).
//
// Le lien partagé avec les clients contient le user_id de
// l'admin : /ticket-client?uid=<user_id>
// Quand un client soumet, le ticket est attribué à cet admin.
//
// Fonctionnalités :
//  - Liste des tickets filtrée par admin connecté
//  - Possibilité de changer le statut d'un ticket (inline)
//  - Lien personnalisé à copier pour partager aux clients
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// ============================================================
// TYPE : structure d'un ticket (correspond aux colonnes BDD)
// ============================================================

type Ticket = {
  id:          string;
  client_name: string;  // Nom fourni par le client anonyme
  email:       string;
  title:       string;
  message:     string;
  status:      "Ouvert" | "En cours" | "Résolu" | "Fermé";
  created_at:  string;
};

// ============================================================
// NAVIGATION LATÉRALE (sidebar partagée dans l'app)
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
    case "Ouvert":   return "bg-blue-100 text-blue-700";
    case "En cours": return "bg-yellow-100 text-yellow-700";
    case "Résolu":   return "bg-green-100 text-green-700";
    case "Fermé":    return "bg-gray-100 text-gray-500";
    default:         return "bg-gray-100 text-gray-500";
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function PageTicketsAdmin() {

  const [emailUtilisateur, setEmailUtilisateur] = useState("");
  const [tickets, setTickets]                   = useState<Ticket[]>([]);
  const [chargement, setChargement]             = useState(true);

  // Lien public à partager avec les clients
  const [lienCopie, setLienCopie]               = useState(false);

  // Ticket actuellement ouvert en détail (null = aucun)
  const [ticketOuvert, setTicketOuvert]         = useState<Ticket | null>(null);

  const router = useRouter();

  // ----------------------------------------------------------
  // Chargement initial : vérification de la session admin
  // puis récupération de TOUS les tickets
  // ----------------------------------------------------------

  const chargerTickets = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    setEmailUtilisateur(session.user.email ?? "");

    // SELECT * → la politique RLS "Admin voit tous les tickets"
    // autorise les utilisateurs connectés à tout lire.
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data as Ticket[]);
    }

    setChargement(false);
  }, [router]);

  useEffect(() => {
    chargerTickets();
  }, [chargerTickets]);

  // ----------------------------------------------------------
  // ACTION : Changer le statut d'un ticket
  // L'admin clique sur le badge de statut pour le faire défiler
  // ----------------------------------------------------------

  const statutsSuivants: Record<string, Ticket["status"]> = {
    "Ouvert":   "En cours",
    "En cours": "Résolu",
    "Résolu":   "Fermé",
    "Fermé":    "Ouvert",
  };

  async function changerStatut(ticket: Ticket) {
    const prochainStatut = statutsSuivants[ticket.status];

    // Mise à jour optimiste : on change l'UI immédiatement
    setTickets((prev) =>
      prev.map((t) => t.id === ticket.id ? { ...t, status: prochainStatut } : t)
    );

    // Synchronisation avec Supabase
    const { error } = await supabase
      .from("tickets")
      .update({ status: prochainStatut })
      .eq("id", ticket.id);

    if (error) {
      // En cas d'erreur, on revient à l'état précédent
      console.error("Erreur mise à jour statut :", error.message);
      setTickets((prev) =>
        prev.map((t) => t.id === ticket.id ? { ...t, status: ticket.status } : t)
      );
    }
  }

  // ----------------------------------------------------------
  // ACTION : Copier le lien client dans le presse-papier
  //
  // Le lien contient le user_id de l'admin connecté (?uid=...).
  // Ainsi, chaque ticket créé via ce lien sera attribué à cet admin
  // et sera visible UNIQUEMENT dans son tableau de bord.
  // ----------------------------------------------------------

  function copierLien() {
    // On récupère la session courante pour obtenir le user_id
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      // Construction du lien avec le uid de l'admin en paramètre
      const lien = `${window.location.origin}/ticket-client?uid=${session.user.id}`;
      navigator.clipboard.writeText(lien).then(() => {
        setLienCopie(true);
        setTimeout(() => setLienCopie(false), 2500);
      });
    });
  }

  // ----------------------------------------------------------
  // ACTION : Déconnexion admin
  // ----------------------------------------------------------

  async function gererDeconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ----------------------------------------------------------
  // ÉCRAN DE CHARGEMENT
  // ----------------------------------------------------------

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
          SIDEBAR — Navigation latérale admin
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

        {/* --- Header avec email admin + déconnexion --- */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tickets clients
            {/* Badge avec le nombre total de tickets */}
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {tickets.length}
            </span>
          </h2>
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

          {/* ================================================
              ENCART : Lien à partager avec les clients
          ================================================ */}
          <div className="mb-8 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-indigo-800">
                Ton lien personnel à partager avec tes clients
              </p>
              {/* Le ?uid= dans l'URL est ton identifiant unique en tant qu'admin. */}
              {/* Chaque ticket créé via ce lien t'est automatiquement attribué. */}
              <p className="mt-0.5 text-xs text-indigo-600">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/ticket-client?uid=…`
                  : "/ticket-client?uid=…"}
              </p>
            </div>
            <button
              onClick={copierLien}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {lienCopie ? "✓ Copié !" : "Copier le lien"}
            </button>
          </div>

          {/* ================================================
              LISTE DES TICKETS
          ================================================ */}
          {tickets.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aucun ticket pour le moment. Partagez le lien avec vos clients !
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  {/* --- Ligne titre + badge statut cliquable --- */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {ticket.title}
                    </h3>

                    {/* Badge statut : cliquer dessus pour faire défiler le statut */}
                    <button
                      onClick={() => changerStatut(ticket)}
                      title="Cliquer pour changer le statut"
                      className={`
                        shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-medium
                        transition-opacity hover:opacity-75
                        ${couleurStatut(ticket.status)}
                      `}
                    >
                      {ticket.status}
                    </button>
                  </div>

                  {/* --- Infos client --- */}
                  <div className="mt-2 flex items-center gap-3">
                    {/* Nom du client */}
                    <span className="text-sm font-medium text-gray-800">
                      {ticket.client_name || "Client anonyme"}
                    </span>
                    <span className="text-gray-300">·</span>
                    {/* Email du client (cliquable pour ouvrir le client mail) */}
                    <a
                      href={`mailto:${ticket.email}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {ticket.email}
                    </a>
                  </div>

                  {/* --- Message : affiché en entier ou tronqué --- */}
                  <p
                    className="mt-3 cursor-pointer text-sm text-gray-600"
                    onClick={() => setTicketOuvert(ticket.id === ticketOuvert?.id ? null : ticket)}
                  >
                    {ticketOuvert?.id === ticket.id
                      ? ticket.message                               // Affiché en entier
                      : ticket.message.slice(0, 120) +              // Tronqué à 120 caractères
                        (ticket.message.length > 120 ? "…" : "")}
                  </p>

                  {/* Lien "Lire la suite" si le message est long */}
                  {ticket.message.length > 120 && (
                    <button
                      onClick={() => setTicketOuvert(ticket.id === ticketOuvert?.id ? null : ticket)}
                      className="mt-1 text-xs text-indigo-500 hover:underline"
                    >
                      {ticketOuvert?.id === ticket.id ? "Réduire ↑" : "Lire la suite ↓"}
                    </button>
                  )}

                  {/* --- Date de création --- */}
                  <p className="mt-4 text-xs text-gray-400">
                    Ouvert le{" "}
                    {new Date(ticket.created_at).toLocaleDateString("fr-FR", {
                      day:   "numeric",
                      month: "long",
                      year:  "numeric",
                    })}{" "}
                    à{" "}
                    {new Date(ticket.created_at).toLocaleTimeString("fr-FR", {
                      hour:   "2-digit",
                      minute: "2-digit",
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
