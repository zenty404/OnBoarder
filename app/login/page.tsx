// ============================================================
// PAGE DE CONNEXION / INSCRIPTION (app/login/page.tsx)
// ============================================================
// Cette page gère l'authentification de l'utilisateur via Supabase Auth.
// Elle propose deux actions :
//   1. Se connecter (signInWithPassword) — pour un compte existant
//   2. S'inscrire (signUp) — pour créer un nouveau compte
//
// C'est un Client Component ("use client") car on utilise :
//   - useState : pour stocker l'email, le mot de passe, les erreurs, etc.
//   - useRouter : pour rediriger l'utilisateur après connexion
//   - Des événements (onClick, onSubmit) : interaction avec le formulaire
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


// ============================================================
// COMPOSANT PRINCIPAL : PageConnexion
// ============================================================

export default function PageConnexion() {

  // ----------------------------------------------------------
  // ÉTATS LOCAUX (useState)
  // ----------------------------------------------------------

  /** Valeur du champ email du formulaire */
  const [email, setEmail] = useState("");

  /** Valeur du champ mot de passe du formulaire */
  const [motDePasse, setMotDePasse] = useState("");

  /** Message d'erreur affiché sous le formulaire en cas de problème */
  const [erreur, setErreur] = useState("");

  /** Indicateur de chargement pour désactiver les boutons pendant un appel API */
  const [chargement, setChargement] = useState(false);

  // ----------------------------------------------------------
  // HOOK DE NAVIGATION
  // ----------------------------------------------------------
  // useRouter() de Next.js (App Router) permet de naviguer
  // programmatiquement vers une autre page après connexion.
  const router = useRouter();


  // ----------------------------------------------------------
  // FONCTION : Connexion (Se connecter)
  // ----------------------------------------------------------
  // Appelle supabase.auth.signInWithPassword avec l'email et le mot de passe.
  // En cas de succès → redirige vers le Dashboard ("/").
  // En cas d'erreur → affiche le message d'erreur sous le formulaire.

  async function gererConnexion() {
    // On réinitialise les messages avant chaque tentative
    setErreur("");
    setChargement(true);

    // Appel à Supabase Auth : tentative de connexion
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: motDePasse,
    });

    setChargement(false);

    if (error) {
      // Supabase renvoie un message d'erreur en anglais,
      // on le traduit pour les cas les plus courants.
      if (error.message.includes("Invalid login credentials")) {
        setErreur("Email ou mot de passe incorrect.");
      } else {
        setErreur(error.message);
      }
      return;
    }

    // Connexion réussie → redirection vers le tableau de bord
    router.push("/");
  }


  // ----------------------------------------------------------
  // FONCTION : Inscription (S'inscrire)
  // ----------------------------------------------------------
  // Appelle supabase.auth.signUp avec l'email et le mot de passe.
  // Pas de vérification d'email : le compte est actif immédiatement.
  // En cas de succès → redirige vers le Dashboard ("/").

  async function gererInscription() {
    setErreur("");
    setChargement(true);

    // Appel à Supabase Auth : création du compte
    const { error } = await supabase.auth.signUp({
      email: email,
      password: motDePasse,
    });

    setChargement(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setErreur("Cet email est déjà utilisé. Essayez de vous connecter.");
      } else {
        setErreur(error.message);
      }
      return;
    }

    // Inscription réussie → redirection directe vers le tableau de bord
    router.push("/");
  }


  // ----------------------------------------------------------
  // RENDU JSX : Formulaire centré sur la page
  // ----------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">

      {/* Carte blanche contenant le formulaire */}
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">

        {/* --- En-tête : Nom de l'app + sous-titre --- */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">OnBoarder</h1>
          <p className="mt-2 text-sm text-gray-500">
            Connectez-vous pour accéder à votre CRM
          </p>
        </div>

        {/* --- Formulaire --- */}
        {/* On utilise onSubmit avec preventDefault pour empêcher le rechargement */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            gererConnexion();
          }}
          className="space-y-5"
        >

          {/* Champ Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* ================================================== */}
          {/* MESSAGES D'ERREUR / SUCCÈS                          */}
          {/* ================================================== */}
          {/* On affiche conditionnellement un message rouge (erreur) */}
          {/* ou vert (succès) sous les champs du formulaire.         */}

          {erreur && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {erreur}
            </div>
          )}

          {/* ================================================== */}
          {/* BOUTONS D'ACTION                                     */}
          {/* ================================================== */}

          {/* Bouton "Se connecter" — type submit, déclenche le onSubmit du formulaire */}
          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {chargement ? "Chargement…" : "Se connecter"}
          </button>

          {/* Bouton "S'inscrire" — type button pour ne PAS soumettre le formulaire */}
          <button
            type="button"
            disabled={chargement}
            onClick={gererInscription}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {chargement ? "Chargement…" : "Créer un compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
