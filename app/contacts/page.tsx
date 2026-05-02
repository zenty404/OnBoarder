// PAGE CONTACTS — Client Component dynamique (Supabase)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";


type Contact = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_id: string;
  created_at: string;
  companies: { name: string } | null; 
};

type Entreprise = {
  id: string;
  name: string;
};

const elementsNavigation = [
    { nom: "Tableau de bord", href: "/",              actif: false, icone: "/dashbord.png" },
    { nom: "Entreprises",     href: "/entreprises",   actif: false, icone: "/entreprises.png" },
    { nom: "Contacts",        href: "/contacts",      actif: true,  icone: "/contacts.png" },
    { nom: "Opportunités",    href: "/opportunites",  actif: false, icone: "/opportunites.png" },
    { nom: "Ticket",          href: "/tickets",        actif: false, icone: "/tickets.png" },

];


export default function PageContacts() {

  const [emailUtilisateur, setEmailUtilisateur] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauEmail, setNouveauEmail] = useState("");
  const [nouveauTelephone, setNouveauTelephone] = useState("");
  const [entrepriseSelectionnee, setEntrepriseSelectionnee] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function verifierSessionEtChargerDonnees() {
      // Vérification session — redirige vers /login si pas connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setEmailUtilisateur(session.user.email ?? "");

      const [resultatContacts, resultatEntreprises] = await Promise.all([
       
        supabase
          .from("contacts")
          .select("*, companies(name)")
          .order("created_at", { ascending: false }),

        supabase
          .from("companies")
          .select("id, name")
          .order("name"),
      ]);

      setContacts(resultatContacts.data ?? []);
      setEntreprises(resultatEntreprises.data ?? []);
      setChargement(false);
    }

    verifierSessionEtChargerDonnees();
  }, [router]);

  async function ajouterContact() {
    if (!nouveauNom.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        full_name: nouveauNom.trim(),
        email: nouveauEmail.trim(),
        phone: nouveauTelephone.trim(),
        company_id: entrepriseSelectionnee || null,
      })
      .select("*, companies(name)")
      .single();

    if (!error && data) {
      setContacts([data, ...contacts]);
      setNouveauNom("");
      setNouveauEmail("");
      setNouveauTelephone("");
      setEntrepriseSelectionnee("");
      setFormulaireOuvert(false);
    }
  }

  async function supprimerContact(id: string) {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (!error) {
      setContacts(contacts.filter((c) => c.id !== id));
    }
  }

  async function gererDeconnexion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Chargement de vos contacts…</p>
      </div>
    );
  }


  return (
    <div className="flex h-full min-h-screen">

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

      <div className="flex flex-1 flex-col">

        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{emailUtilisateur}</span>
            <Image src="/user.png" alt="Utilisateur" width={20} height={20} />
            <button onClick={gererDeconnexion} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
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
              + Ajouter un Contact
            </button>
          </div>

          {formulaireOuvert && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Nouveau contact</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={nouveauEmail}
                  onChange={(e) => setNouveauEmail(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={nouveauTelephone}
                  onChange={(e) => setNouveauTelephone(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                />
                <select
                  value={entrepriseSelectionnee}
                  onChange={(e) => setEntrepriseSelectionnee(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Sélectionner une entreprise --</option>
                  {entreprises.map((entreprise) => (
                    <option key={entreprise.id} value={entreprise.id}>
                      {entreprise.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={ajouterContact} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                  Valider
                </button>
                <button onClick={() => setFormulaireOuvert(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {contacts.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Aucun contact pour le moment. Ajoutez-en un !
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-2xl border border-gray-200 bg-white p-6  transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <Image src="/user.png" alt="Contact" width={28} height={28} />
                    <h3 className="text-xl font-bold text-gray-900">{contact.full_name}</h3>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-gray-500">
                      Entreprise : <span className="text-gray-700">{contact.companies?.name ?? "—"}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Email : <span className="text-gray-700">{contact.email || "—"}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Téléphone : <span className="text-gray-700">{contact.phone || "—"}</span>
                    </p>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button onClick={() => supprimerContact(contact.id)}>
                      <Image src="/delete.png" alt="Supprimer contact" width={24} height={24} className="hover:cursor-pointer"/>
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
