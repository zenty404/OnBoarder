-- ============================================================
-- MIGRATION 004 : Table "tickets" — Système de support client
--
-- OBJECTIF :
--   Permettre aux clients (non connectés) de créer un ticket
--   via un lien public, ET permettre à l'admin (connecté)
--   de voir et gérer TOUS les tickets reçus.
--
-- PARTICULARITÉ :
--   Cette table est la seule avec une politique INSERT ouverte
--   au rôle "anon" (non connecté), car les clients n'ont pas
--   de compte dans l'application.
--   user_id est donc NULLABLE (NULL pour les clients anonymes).
--
-- ORDRE : À exécuter APRÈS 001, 002, 003
--         (pas de dépendances directes aux autres tables,
--          mais on respecte l'ordre logique du projet)
-- ============================================================



-- ------------------------------------------------------------
-- ÉTAPE 1 : Suppression préventive
-- ⚠️  Supprime la table et toutes les données existantes.
-- ------------------------------------------------------------

DROP TABLE IF EXISTS public.tickets CASCADE;


-- ------------------------------------------------------------
-- ÉTAPE 2 : Création de la table
-- ------------------------------------------------------------

CREATE TABLE public.tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- user_id NULLABLE : les clients anonymes n'ont pas de compte.
  -- On utilise SET NULL pour ne pas supprimer le ticket si
  -- l'utilisateur admin venait à être supprimé.
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Informations renseignées par le client anonyme via le formulaire public
  client_name TEXT        NOT NULL DEFAULT '',   -- Prénom / Nom du client
  email       TEXT        NOT NULL DEFAULT '',   -- Email de contact pour le suivi
  title       TEXT        NOT NULL,              -- Titre court du problème
  message     TEXT        NOT NULL,              -- Description complète du problème

  -- Statut géré par l'admin depuis son tableau de bord
  -- Cycle : Ouvert → En cours → Résolu → Fermé
  status      TEXT        NOT NULL DEFAULT 'Ouvert'
                          CHECK (status IN ('Ouvert', 'En cours', 'Résolu', 'Fermé')),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- ÉTAPE 3 : Activation de la sécurité RLS
-- ------------------------------------------------------------

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- ÉTAPE 4 : Suppression des anciennes politiques (ré-exécution propre)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Clients peuvent créer un ticket" ON public.tickets;
DROP POLICY IF EXISTS "Admin voit tous les tickets"     ON public.tickets;
DROP POLICY IF EXISTS "Admin peut modifier les tickets" ON public.tickets;


-- ------------------------------------------------------------
-- ÉTAPE 5 : Politique INSERT — ouverte à TOUS (clients anonymes)
--
-- TO public inclut le rôle "anon" de Supabase, qui représente
-- les utilisateurs NON authentifiés. Sans cela, les clients
-- sans compte ne pourraient pas créer de ticket.
-- ------------------------------------------------------------

CREATE POLICY "Clients peuvent créer un ticket"
  ON public.tickets
  FOR INSERT
  TO public           -- rôle "anon" (non connecté) + "authenticated"
  WITH CHECK (true);  -- aucune condition : tout le monde peut insérer


-- ------------------------------------------------------------
-- ÉTAPE 6 : Politique SELECT — admin connecté voit TOUT
--
-- L'admin voit tous les tickets (pas de filtre user_id),
-- contrairement aux autres tables où chacun voit les siennes.
-- ------------------------------------------------------------

CREATE POLICY "Admin voit tous les tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated    -- uniquement les utilisateurs connectés
  USING (true);       -- sans filtre : tous les tickets sont visibles


-- ------------------------------------------------------------
-- ÉTAPE 7 : Politique UPDATE — l'admin peut changer le statut
-- ------------------------------------------------------------

CREATE POLICY "Admin peut modifier les tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ------------------------------------------------------------
-- ✅ VÉRIFICATION
-- ------------------------------------------------------------

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'tickets';
