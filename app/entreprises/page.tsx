// PAGE ENTREPRISES — Client Component dynamique (Supabase)
// Vérifie la session, fetch les companies, gère l'ajout et la suppression.

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// --- Types ---

/** Entreprise issue de la table "companies" dans Supabase */
type Entreprise = {
  id: string;
  name: string;
  website: string;
  created_at: string;
};

// --- Navigation sidebar ---

const elementsNavigation = [
  { nom: "Tableau de bord", href: "/",              actif: false, icone: "/dashbord.png" },
  { nom: "Entreprises",     href: "/entreprises",   actif: true,  icone: "/entreprises.png" },
  { nom: "Contacts",        href: "/contacts",      actif: false, icone: "/contacts.png" },
  { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
];

// --- Composant principal ---

export default function PageEntreprises() {

  // États locaux
  const [emailUtilisateur, setEmailUtilisateur] = useState("");
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauSiteWeb, setNouveauSiteWeb] = useState("");

  const router = useRouter();

  // Au montage : vérifier la session + charger les entreprises
  useEffect(() => {
    async function verifierSessionEtChargerDonnees() {
      // Vérification session — redirige vers /login si pas connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setEmailUtilisateur(session.user.email ?? "");

      // SELECT * FROM companies ORDER BY created_at DESC
      // Le RLS filtre automatiquement par user_id
      const { data } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      setEntreprises(data ?? []);
      setChargement(false);
    }

    verifierSessionEtChargerDonnees();
  }, [router]);

  // Ajout d'une entreprise : INSERT avec user_id explicite (RLS)
  async function ajouterEntreprise() {
    if (!nouveauNom.trim()) return;

    // getUser() = identité vérifiée (plus sûr que getSession pour l'ID)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // INSERT dans "companies" — .select().single() retourne la ligne créée
    const { data, error } = await supabase
      .from("companies")
      .insert({ user_id: user.id, name: nouveauNom.trim(), website: nouveauSiteWeb.trim() })
      .select()
      .single();

    if (!error && data) {
      setEntreprises([data, ...entreprises]); // ajout en tête de liste
      setNouveauNom("");
      setNouveauSiteWeb("");
      setFormulaireOuvert(false);
    }
  }

  // Suppression d'une entreprise : DELETE WHERE id = ... (RLS protège)
  async function supprimerEntreprise(id: string) {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (!error) {
      setEntreprises(entreprises.filter((e) => e.id !== id));
    }
  }

  // Déconnexion : détruit la session et redirige
  async function gererDeconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Écran de chargement (évite un flash de contenu vide)
  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Chargement de vos entreprises…</p>
      </div>
    );
  }

  // --- Rendu JSX ---

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

      {/* ZONE PRINCIPALE */}
      <div className="flex flex-1 flex-col">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Entreprises</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{emailUtilisateur}</span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button onClick={gererDeconnexion} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Déconnexion
            </button>
          </div>
        </header>

        {/* CONTENU */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* Bouton d'ajout — bascule l'affichage du formulaire */}
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Ajouter une Entreprise
            </button>
          </div>

          {/* Formulaire d'ajout (2 champs : nom + site web) */}
          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Nouvelle entreprise</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Site web (ex: www.exemple.fr)"
                  value={nouveauSiteWeb}
                  onChange={(e) => setNouveauSiteWeb(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={ajouterEntreprise} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                  Valider
                </button>
                <button onClick={() => setFormulaireOuvert(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Grille des cartes entreprises */}
          {entreprises.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aucune entreprise pour le moment. Ajoutez-en une !
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {entreprises.map((entreprise) => (
                <div key={entreprise.id} className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
                  {/* Nom */}
                  <div className="flex items-center gap-4">
                    <Image src="/entreprises.png" alt="Entreprise" width={28} height={28} />
                    <h3 className="text-xl font-bold text-gray-900">{entreprise.name}</h3>
                  </div>
                  {/* Site web */}
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-gray-500">
                      Site Web : <span className="text-gray-700">{entreprise.website || "—"}</span>
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-between">
                    <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                      Contacter
                    </button>
                    <button onClick={() => supprimerEntreprise(entreprise.id)}>
                      <Image src="/delete.png" alt="Supprimer entreprise" width={24} height={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
