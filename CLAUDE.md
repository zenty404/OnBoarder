@AGENTS.md
# Instructions pour l'Assistant IA - Projet : OnBoarder CRM / ElarDev

## Rôle et État d'Esprit ("Good Vibe Coder")
- **Simplicité avant tout :** Code comme pour un projet étudiant de bon niveau. Va droit au but, fais simple et efficace. Pas de sur-ingénierie, d'abstractions inutiles ou d'architectures trop complexes.
- **Pédagogie et Documentation :** Le code doit être documenté à fond. Ajoute des commentaires riches et explicites **en français** pour expliquer la logique de chaque composant, fonction ou requête complexe.
- **Suivi du contexte :** Garde toujours le fil de la conversation globale et des choix précédents pour ne pas perdre le cap en cours de route.

## Règles Strictes de Workflow
- **Zéro Auto-Commit :** Tu ne dois **JAMAIS** exécuter de commandes `git commit`, `git push` ou fusionner des branches à notre place. Nous gardons le contrôle total sur notre historique Git.
- **Standardisation `npx` :** Pour l'initialisation et la gestion de tous les packages, utilise exclusivement `npx`. Maintiens la même méthode de travail fluide et éprouvée que celle utilisée sur le projet `arthur.dev`.

## Le Projet
**Objectif :** Un mini-CRM pour simplifier l'administratif d'un indépendant ou d'une TPE. Permettre de centraliser les contacts et suivre les opportunités commerciales en un coup d'œil, sans fioritures.

**Stack Technique :**
- Frontend : Next.js (App Router) & React JS
- Styling : Tailwind CSS v4
- Backend & BDD : Supabase (PostgreSQL + Auth avec règles RLS)
- Déploiement : Vercel (Environnements de preview sur `dev`, production sur `main`)

## Périmètre Fonctionnel (CRUD Basique)
1. **Authentification :** Connexion/Déconnexion via Supabase Auth.
2. **Dashboard :** Vue rapide avec le nombre de contacts, le nombre d'opportunités en cours, et le CA potentiel.
3. **Entreprises :** Gestion basique (nom, site web).
4. **Contacts :** Liste, ajout, modification, suppression. Un contact est lié à une entreprise.
5. **Opportunités (Deals) :** Liées à un contact. Champs : Titre, Montant, Statut (*À contacter*, *En négociation*, *Conclu*, *Perdu*).

## Structure de la Base de Données (Supabase)

Toutes les tables intègrent la logique multi-tenant avec `user_id` lié à `auth.users` et sécurisé par RLS.

### 1. Table `companies` (Entreprises clientes)
- `id` : UUID (Clé primaire)
- `user_id` : UUID (Clé étrangère -> auth.users.id)
- `name` : Texte
- `website` : Texte
- `created_at` : Timestamp

### 2. Table `contacts` (Personnes physiques)
- `id` : UUID (Clé primaire)
- `user_id` : UUID (Clé étrangère -> auth.users.id)
- `company_id` : UUID (Clé étrangère -> companies.id)
- `full_name` : Texte
- `email` : Texte
- `phone` : Texte
- `created_at` : Timestamp

### 3. Table `deals` (Opportunités)
- `id` : UUID (Clé primaire)
- `user_id` : UUID (Clé étrangère -> auth.users.id)
- `contact_id` : UUID (Clé étrangère -> contacts.id)
- `title` : Texte
- `amount` : Numérique
- `status` : Texte (Valeurs : 'À contacter', 'En négociation', 'Conclu', 'Perdu')
- `created_at` : Timestamp