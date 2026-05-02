-- ============================================================
-- MIGRATION 002 : Table "contacts" — Personnes physiques
--
-- OBJECTIF :
--   Stocker les contacts (personnes) liés à une entreprise.
--   Un contact appartient à un utilisateur ET à une entreprise.
--   Si l'entreprise est supprimée → le contact est supprimé (CASCADE).
--
-- ORDRE : À exécuter APRÈS 001_create_companies.sql
--         (dépend de la table "companies")
-- ============================================================



-- ------------------------------------------------------------
-- ÉTAPE 1 : Suppression préventive
-- ⚠️  Supprime la table et toutes les données existantes.
-- ------------------------------------------------------------

DROP TABLE IF EXISTS public.contacts CASCADE;
-- CASCADE : supprime aussi les tables qui référencent contacts
-- (deals notamment) — ne pas oublier de les recréer ensuite.


-- ------------------------------------------------------------
-- ÉTAPE 2 : Création de la table
-- ------------------------------------------------------------

CREATE TABLE public.contacts (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Propriétaire du contact (multi-tenant)
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entreprise à laquelle appartient ce contact (optionnel)
  -- ON DELETE CASCADE : si l'entreprise est supprimée, le contact l'est aussi
  company_id UUID        REFERENCES public.companies(id) ON DELETE CASCADE,

  full_name  TEXT        NOT NULL,  -- Nom complet du contact
  email      TEXT,                  -- Email (optionnel)
  phone      TEXT,                  -- Téléphone (optionnel)

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- ------------------------------------------------------------
-- ÉTAPE 3 : Activation de la sécurité RLS
-- ------------------------------------------------------------

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- ÉTAPE 4 : Politique RLS — CRUD complet réservé au propriétaire
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Gestion complète des contacts par l'utilisateur" ON public.contacts;

CREATE POLICY "Gestion complète des contacts par l'utilisateur"
  ON public.contacts
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);


-- ------------------------------------------------------------
-- ✅ VÉRIFICATION
-- ------------------------------------------------------------

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'contacts';
