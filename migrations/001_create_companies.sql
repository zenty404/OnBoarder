-- ============================================================
-- MIGRATION 001 : Table "companies" — Entreprises clientes
--
-- OBJECTIF :
--   Stocker les entreprises liées à un utilisateur (admin).
--   Chaque utilisateur ne voit et ne gère QUE ses propres entreprises
--   grâce à la politique RLS basée sur user_id.
--
-- ORDRE : À exécuter EN PREMIER (pas de dépendances)
-- ============================================================



-- ------------------------------------------------------------
-- ÉTAPE 1 : Suppression préventive (pour ré-exécution propre)
-- ⚠️  Supprime la table et toutes les données existantes.
-- ------------------------------------------------------------

DROP TABLE IF EXISTS public.companies CASCADE;
-- CASCADE : supprime aussi les tables qui référencent companies
-- (contacts notamment) — ne pas oublier de les recréer ensuite.


-- ------------------------------------------------------------
-- ÉTAPE 2 : Création de la table
-- ------------------------------------------------------------

CREATE TABLE public.companies (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Lien vers l'utilisateur propriétaire (multi-tenant)
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name       TEXT        NOT NULL,          -- Nom de l'entreprise
  website    TEXT,                          -- Site web (optionnel)

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- ------------------------------------------------------------
-- ÉTAPE 3 : Activation de la sécurité RLS
-- Chaque ligne n'est visible que par son propriétaire.
-- ------------------------------------------------------------

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- ÉTAPE 4 : Politique RLS — CRUD complet réservé au propriétaire
--
-- FOR ALL couvre SELECT, INSERT, UPDATE, DELETE.
-- auth.uid() retourne l'UUID de l'utilisateur connecté.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Gestion complète des entreprises par l'utilisateur" ON public.companies;

CREATE POLICY "Gestion complète des entreprises par l'utilisateur"
  ON public.companies
  FOR ALL
  USING       (auth.uid() = user_id)   -- Lecture/Modification/Suppression
  WITH CHECK  (auth.uid() = user_id);  -- Insertion


-- ------------------------------------------------------------
-- ✅ VÉRIFICATION
-- ------------------------------------------------------------

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'companies';
