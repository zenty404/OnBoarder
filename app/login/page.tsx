// ============================================================
// PAGE DE CONNEXION / INSCRIPTION (app/login/page.tsx)
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

  const [email, setEmail] = useState("");

  const [motDePasse, setMotDePasse] = useState("");

  const [erreur, setErreur] = useState("");

  const [chargement, setChargement] = useState(false);

  // ----------------------------------------------------------
  // HOOK DE NAVIGATION
  // ----------------------------------------------------------
  
  const router = useRouter();


  // ----------------------------------------------------------
  // FONCTION : Connexion (Se connecter)
  // ----------------------------------------------------------
  

  async function gererConnexion() {
    setErreur("");
    setChargement(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: motDePasse,
    });

    setChargement(false);

    if (error) {
      
      if (error.message.includes("Invalid login credentials")) {
        setErreur("Email ou mot de passe incorrect.");
      } else {
        setErreur(error.message);
      }
      return;
    }

    router.push("/");
  }


  // ----------------------------------------------------------
  // FONCTION : Inscription (S'inscrire)
  // ----------------------------------------------------------
  

  async function gererInscription() {
    setErreur("");
    setChargement(true);

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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            gererConnexion();
          }}
          className="space-y-5"
        >

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
         
          {erreur && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {erreur}
            </div>
          )}

          {/* ================================================== */}
          {/* BOUTONS D'ACTION                                     */}
          {/* ================================================== */}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {chargement ? "Chargement…" : "Se connecter"}
          </button>

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
