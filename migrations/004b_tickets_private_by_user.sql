-- ============================================================
-- MIGRATION 004b : Mise à jour des politiques RLS — tickets
--
-- OBJECTIF :
--   Rendre les tickets privés par utilisateur.
--   Chaque admin ne voit QUE les tickets créés via SON lien.
--
--   Le lien partagé contient le user_id de l'admin :
--     /ticket-client?uid=<user_id>
--   Quand le client soumet, le user_id est enregistré dans le ticket.
--   Ainsi, la politique SELECT filtre sur auth.uid() = user_id.
--
-- À EXÉCUTER dans l'éditeur SQL de Supabase
-- ============================================================


-- ------------------------------------------------------------
-- Suppression des anciennes politiques SELECT et UPDATE
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Admin voit tous les tickets"     ON public.tickets;
DROP POLICY IF EXISTS "Admin peut modifier les tickets" ON public.tickets;


-- ------------------------------------------------------------
-- Nouvelle politique SELECT — l'admin voit UNIQUEMENT ses tickets
--
-- Avant : USING (true) → tous les tickets visibles
-- Après : USING (auth.uid() = user_id) → seulement les siens
-- ------------------------------------------------------------

CREATE POLICY "Admin voit ses propres tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);  -- Filtre strict : uniquement les tickets du bon admin


-- ------------------------------------------------------------
-- Nouvelle politique UPDATE — l'admin modifie UNIQUEMENT ses tickets
-- ------------------------------------------------------------

CREATE POLICY "Admin peut modifier ses propres tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- La politique INSERT reste inchangée :
-- "Clients peuvent créer un ticket" → TO public, WITH CHECK (true)
-- Le user_id est fourni par le client via le paramètre URL ?uid=
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- ✅ VÉRIFICATION
-- ------------------------------------------------------------

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'tickets';
