-- ============================================================
-- MIGRATION 003 : Table "deals" — Opportunités commerciales
--
-- OBJECTIF :
--   Stocker les opportunités (deals) liées à un contact.
--   Chaque deal a un titre, un montant potentiel et un statut
--   qui suit le pipeline commercial.
--   Si le contact associé est supprimé → le deal est supprimé (CASCADE).
--
-- ORDRE : À exécuter APRÈS 002_create_contacts.sql
--         (dépend de la table "contacts")
-- ============================================================



-- ------------------------------------------------------------
-- ÉTAPE 1 : Suppression préventive
-- ⚠️  Supprime la table et toutes les données existantes.
-- ------------------------------------------------------------

DROP TABLE IF EXISTS public.deals CASCADE;


-- ------------------------------------------------------------
-- ÉTAPE 2 : Création de la table
-- ------------------------------------------------------------

CREATE TABLE public.deals (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Propriétaire du deal (multi-tenant)
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact lié au deal
  -- ON DELETE CASCADE : si le contact est supprimé, le deal l'est aussi
  contact_id UUID        REFERENCES public.contacts(id) ON DELETE CASCADE,

  title      TEXT        NOT NULL,          -- Titre de l'opportunité

  -- Montant potentiel du deal (en euros ou devise par défaut)
  amount     NUMERIC     NOT NULL DEFAULT 0,

  -- Statut du pipeline commercial
  -- Valeurs autorisées : pipeline figé à 4 étapes
  status     TEXT        NOT NULL DEFAULT 'À contacter'
                         CHECK (status IN ('À contacter', 'En négociation', 'Conclu', 'Perdu')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- ------------------------------------------------------------
-- ÉTAPE 3 : Activation de la sécurité RLS
-- ------------------------------------------------------------

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- ÉTAPE 4 : Politique RLS — CRUD complet réservé au propriétaire
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Gestion complète des deals par l'utilisateur" ON public.deals;

CREATE POLICY "Gestion complète des deals par l'utilisateur"
  ON public.deals
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);


-- ------------------------------------------------------------
-- ✅ VÉRIFICATION
-- ------------------------------------------------------------

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'deals';
