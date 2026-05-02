// Page admin — gestion des tickets clients.
// Accessible uniquement si connecté. La RLS filtre les tickets par user_id.
// Le bouton "Copier le lien" génère une URL avec ?uid= pour les clients.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Ticket = {
  id:          string;
  client_name: string;
  email:       string;
  title:       string;
  message:     string;
  status:      "Ouvert" | "En cours" | "Résolu" | "Fermé";
  created_at:  string;
};

const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",             actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",  actif: false, icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",     actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites", actif: false, icone: "/opportunites.png" },
  { nom: "Ticket",          href: "/tickets",      actif: true,  icone: "/tickets.png" },
];

// Couleur du badge selon le statut
function couleurStatut(statut: string): string {
  switch (statut) {
    case "Ouvert":   return "bg-blue-100 text-blue-700";
    case "En cours": return "bg-yellow-100 text-yellow-700";
    case "Résolu":   return "bg-green-100 text-green-700";
    case "Fermé":    return "bg-gray-100 text-gray-500";
    default:         return "bg-gray-100 text-gray-500";
  }
}

export default function PageTicketsAdmin() {

  const [emailUtilisateur, setEmailUtilisateur] = useState("");
  const [tickets, setTickets]                   = useState<Ticket[]>([]);
  const [chargement, setChargement]             = useState(true);
  const [lienCopie, setLienCopie]               = useState(false);
  const [ticketOuvert, setTicketOuvert]         = useState<Ticket | null>(null);
  const router = useRouter();

  const chargerTickets = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setEmailUtilisateur(session.user.email ?? "");

    // La RLS filtre automatiquement sur auth.uid() = user_id
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setTickets(data as Ticket[]);
    setChargement(false);
  }, [router]);

  useEffect(() => { chargerTickets(); }, [chargerTickets]);

  // Clic sur le badge = statut suivant dans le cycle
  const statutsSuivants: Record<string, Ticket["status"]> = {
    "Ouvert": "En cours", "En cours": "Résolu", "Résolu": "Fermé", "Fermé": "Ouvert",
  };

  async function changerStatut(ticket: Ticket) {
    const prochainStatut = statutsSuivants[ticket.status];
    // Mise à jour optimiste
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: prochainStatut } : t));
    const { error } = await supabase.from("tickets").update({ status: prochainStatut }).eq("id", ticket.id);
    if (error) {
      console.error("Erreur mise à jour statut :", error.message);
      setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: ticket.status } : t));
    }
  }

  // Copie le lien client avec le user_id de l'admin en paramètre ?uid=
  function copierLien() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const lien = `${window.location.origin}/ticket-client?uid=${session.user.id}`;
      navigator.clipboard.writeText(lien).then(() => {
        setLienCopie(true);
        setTimeout(() => setLienCopie(false), 2500);
      });
    });
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

  return (
    <div className="flex h-full min-h-screen">

      {/* Sidebar */}
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
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${element.actif ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"}`}
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

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tickets clients
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {tickets.length}
            </span>
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{emailUtilisateur}</span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button onClick={gererDeconnexion} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">

          {/* Lien personnalisé à partager avec les clients */}
          <div className="mb-8 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-indigo-800">Ton lien personnel à partager avec tes clients</p>
              <p className="mt-0.5 text-xs text-indigo-600">
                {typeof window !== "undefined" ? `${window.location.origin}/ticket-client?uid=…` : "/ticket-client?uid=…"}
              </p>
            </div>
            <button onClick={copierLien} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
              {lienCopie ? "✓ Copié !" : "Copier le lien"}
            </button>
          </div>

          {tickets.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Aucun ticket pour le moment. Partagez le lien avec vos clients !</p>
          ) : (
            <div className="flex flex-col gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold text-gray-900">{ticket.title}</h3>
                    {/* Badge cliquable pour changer le statut */}
                    <button
                      onClick={() => changerStatut(ticket)}
                      title="Cliquer pour changer le statut"
                      className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-75 ${couleurStatut(ticket.status)}`}
                    >
                      {ticket.status}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">{ticket.client_name || "Client anonyme"}</span>
                    <span className="text-gray-300">·</span>
                    <a href={`mailto:${ticket.email}`} className="text-sm text-indigo-600 hover:underline">{ticket.email}</a>
                  </div>

                  {/* Message tronqué — clic pour développer */}
                  <p
                    className="mt-3 cursor-pointer text-sm text-gray-600"
                    onClick={() => setTicketOuvert(ticket.id === ticketOuvert?.id ? null : ticket)}
                  >
                    {ticketOuvert?.id === ticket.id
                      ? ticket.message
                      : ticket.message.slice(0, 120) + (ticket.message.length > 120 ? "…" : "")}
                  </p>

                  {ticket.message.length > 120 && (
                    <button
                      onClick={() => setTicketOuvert(ticket.id === ticketOuvert?.id ? null : ticket)}
                      className="mt-1 text-xs text-indigo-500 hover:underline"
                    >
                      {ticketOuvert?.id === ticket.id ? "Réduire ↑" : "Lire la suite ↓"}
                    </button>
                  )}

                  <p className="mt-4 text-xs text-gray-400">
                    Ouvert le{" "}
                    {new Date(ticket.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}{" "}
                    à{" "}
                    {new Date(ticket.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
