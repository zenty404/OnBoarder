// ============================================================
// PAGE PUBLIQUE — Soumission de ticket client
//
// Cette page est ACCESSIBLE SANS COMPTE.
// Le client reçoit un lien unique de la forme :
//   /ticket-client?uid=<user_id_de_l_admin>
//
// Le paramètre "uid" dans l'URL identifie à quel admin
// appartient ce ticket. Ainsi chaque admin ne voit QUE
// les tickets créés via son propre lien.
//
// Si le paramètre uid est absent ou invalide, on affiche
// un message d'erreur → le lien est incomplet.
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ============================================================
// COMPOSANT INTERNE — isolé dans un Suspense pour useSearchParams
// Next.js oblige à wrapper useSearchParams dans Suspense.
// ============================================================

function FormulaireTicket() {

  // Récupération du paramètre ?uid= dans l'URL
  // Ce uid est le user_id de l'admin qui a partagé le lien.
  const searchParams = useSearchParams();
  const adminUid     = searchParams.get("uid");

  // --- États du formulaire ---
  const [clientName, setClientName] = useState("");
  const [email, setEmail]           = useState("");
  const [titre, setTitre]           = useState("");
  const [message, setMessage]       = useState("");

  // --- États de l'UI ---
  const [envoi, setEnvoi]         = useState<"idle" | "chargement" | "succes" | "erreur">("idle");
  const [erreurMsg, setErreurMsg] = useState("");

  // ----------------------------------------------------------
  // GARDE : Si le lien ne contient pas de uid, on bloque tout.
  // Le client a reçu un lien incomplet ou malformé.
  // ----------------------------------------------------------

  useEffect(() => {
    if (!adminUid) {
      setErreurMsg("Lien invalide. Demande un nouveau lien à ton interlocuteur.");
    }
  }, [adminUid]);

  // ----------------------------------------------------------
  // ACTION : Envoyer le ticket vers Supabase
  // ----------------------------------------------------------

  async function envoyerTicket() {
    // Validation simple côté client
    if (!clientName.trim() || !email.trim() || !titre.trim() || !message.trim()) {
      setErreurMsg("Merci de remplir tous les champs.");
      return;
    }

    // Sécurité : on ne peut pas envoyer sans uid admin dans l'URL
    if (!adminUid) {
      setErreurMsg("Lien invalide. Impossible d'envoyer le ticket.");
      return;
    }

    setEnvoi("chargement");
    setErreurMsg("");

    // Insertion dans Supabase.
    // On passe le user_id de l'admin (récupéré depuis le paramètre ?uid=)
    // pour que ce ticket lui soit attribué et qu'il puisse le voir.
    // La politique RLS "Clients peuvent créer un ticket" autorise l'insert
    // pour les utilisateurs non connectés (rôle anon).
    const { error } = await supabase
      .from("tickets")
      .insert({
        user_id:     adminUid,          // ← Attribué à l'admin qui a partagé le lien
        client_name: clientName.trim(),
        email:       email.trim(),
        title:       titre.trim(),
        message:     message.trim(),
        // status → "Ouvert" par défaut (valeur DEFAULT dans la BDD)
      });

    if (error) {
      console.error("Erreur Supabase :", error.message);
      setErreurMsg("Une erreur est survenue. Réessaie dans quelques instants.");
      setEnvoi("erreur");
      return;
    }

    // ✅ Succès : affichage de la confirmation
    setEnvoi("succes");
  }

  // ----------------------------------------------------------
  // RENDU — Écran de confirmation après envoi réussi
  // ----------------------------------------------------------

  if (envoi === "succes") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-10 text-center shadow-sm">

          {/* Icône de validation */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Ticket envoyé !</h1>
          <p className="mt-3 text-sm text-gray-500">
            Ton ticket a bien été reçu. Nous reviendrons vers toi à l&apos;adresse{" "}
            <span className="font-medium text-gray-700">{email}</span> dès que possible.
          </p>

          {/* Option pour envoyer un autre ticket (conserve le uid dans l'URL) */}
          <button
            onClick={() => {
              setClientName("");
              setEmail("");
              setTitre("");
              setMessage("");
              setEnvoi("idle");
            }}
            className="mt-8 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ouvrir un autre ticket
          </button>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDU — Lien invalide (pas de uid dans l'URL)
  // ----------------------------------------------------------

  if (!adminUid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Lien invalide</h1>
          <p className="mt-3 text-sm text-gray-500">
            Ce lien est incomplet ou a expiré. Contacte ton interlocuteur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDU PRINCIPAL — Formulaire de création de ticket
  // ----------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">

        {/* ------------------------------------------------
            EN-TÊTE de la page
        ------------------------------------------------ */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-indigo-600">OnBoarder</span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Ouvrir un ticket
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Décris ton problème ou ta demande. On te répond par email.
          </p>
        </div>

        {/* ------------------------------------------------
            FORMULAIRE
        ------------------------------------------------ */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-5">

            {/* Champ : Nom complet */}
            <div>
              <label htmlFor="clientName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Ton nom
              </label>
              <input
                id="clientName"
                type="text"
                placeholder="Jean Dupont"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Champ : Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Ton email
              </label>
              <input
                id="email"
                type="email"
                placeholder="jean@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Champ : Titre du ticket */}
            <div>
              <label htmlFor="titre" className="mb-1.5 block text-sm font-medium text-gray-700">
                Sujet
              </label>
              <input
                id="titre"
                type="text"
                placeholder="ex : Problème de connexion à mon espace"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Champ : Message détaillé */}
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700">
                Décris ton problème
              </label>
              <textarea
                id="message"
                placeholder="Explique en détail ce qui se passe, les étapes pour reproduire le problème, etc."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

          </div>

          {/* Message d'erreur */}
          {erreurMsg && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {erreurMsg}
            </p>
          )}

          {/* Bouton d'envoi */}
          <button
            onClick={envoyerTicket}
            disabled={envoi === "chargement"}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {envoi === "chargement" ? "Envoi en cours…" : "Envoyer mon ticket"}
          </button>

        </div>

        {/* Pied de page discret */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Tu as déjà un compte ?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Se connecter
          </a>
        </p>

      </div>
    </div>
  );
}

// ============================================================
// EXPORT — Wrappé dans Suspense (requis par Next.js pour
// les composants utilisant useSearchParams côté client)
// ============================================================

export default function PageTicketClient() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    }>
      <FormulaireTicket />
    </Suspense>
  );
}
