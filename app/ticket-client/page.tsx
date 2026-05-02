// Page publique de soumission de ticket — sans compte requis.
// Le lien contient ?uid=<user_id_admin> pour attribuer le ticket au bon admin.
// Sans ce paramètre, la page affiche un message d'erreur.

"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Isolé dans un composant interne car useSearchParams nécessite un Suspense boundary.
function FormulaireTicket() {

  // On lit le ?uid= dans l'URL — c'est l'identifiant de l'admin destinataire.
  const searchParams = useSearchParams();
  const adminUid     = searchParams.get("uid");

  const [clientName, setClientName] = useState("");
  const [email, setEmail]           = useState("");
  const [titre, setTitre]           = useState("");
  const [message, setMessage]       = useState("");

  const [envoi, setEnvoi]         = useState<"idle" | "chargement" | "succes" | "erreur">("idle");
  const [erreurMsg, setErreurMsg] = useState("");

  async function envoyerTicket() {
    if (!clientName.trim() || !email.trim() || !titre.trim() || !message.trim()) {
      setErreurMsg("Merci de remplir tous les champs.");
      return;
    }

    if (!adminUid) {
      setErreurMsg("Lien invalide. Impossible d'envoyer le ticket.");
      return;
    }

    setEnvoi("chargement");
    setErreurMsg("");

    // On passe le user_id de l'admin pour que la RLS l'attribue correctement.
    const { error } = await supabase
      .from("tickets")
      .insert({
        user_id:     adminUid,
        client_name: clientName.trim(),
        email:       email.trim(),
        title:       titre.trim(),
        message:     message.trim(),
      });

    if (error) {
      console.error("Erreur Supabase :", error.message);
      setErreurMsg("Une erreur est survenue. Réessaie dans quelques instants.");
      setEnvoi("erreur");
      return;
    }

    setEnvoi("succes");
  }

  // Écran de confirmation
  if (envoi === "succes") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-10 text-center shadow-sm">

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

  // Lien sans uid — le client a reçu un mauvais lien
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-indigo-600">OnBoarder</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Ouvrir un ticket
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Décris ton problème ou ta demande. On te répond par email.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5">

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

          {erreurMsg && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {erreurMsg}
            </p>
          )}

          <button
            onClick={envoyerTicket}
            disabled={envoi === "chargement"}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {envoi === "chargement" ? "Envoi en cours…" : "Envoyer mon ticket"}
          </button>

        </div>

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

// Wrapper requis par Next.js pour les composants utilisant useSearchParams.
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
