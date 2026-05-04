<div align="center">

# 🚀 OnBoarder

### Mini-CRM pour indépendants & TPE

**Cours MSD — Mise en situation développeur**
Réalisé par **Arthur LASNIER et Elio CHARNAY** · Encadré par **Graven**

---

[![Next.js](https://img.shields.io/badge/Next.js_15-App_Router-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_+_Auth-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-Styling-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Déploiement-black?logo=vercel)](https://vercel.com/)

</div>

---

## 🎯 Contexte du projet

> **Consigne :** Simplifier la vie d'une entreprise.

**OnBoarder** est un mini-CRM conçu pour répondre à un problème concret : les indépendants et les petites entreprises perdent du temps à jongler entre leurs outils (Excel, mails, post-its…) pour gérer leurs contacts et suivre leurs opportunités commerciales.

L'objectif est simple : **tout centraliser en un seul endroit**, sans friction, sans superflu.

---

## ✨ Fonctionnalités

| Module | Description |
|---|---|
| 🔐 **Authentification** | Connexion sécurisée via Supabase Auth |
| 📊 **Dashboard** | Vue synthétique : contacts, deals en cours, CA potentiel |
| 🏢 **Entreprises** | Gestion des clients (nom, site web) |
| 👤 **Contacts** | Annuaire des personnes, liées à une entreprise |
| 💼 **Opportunités** | Pipeline commercial avec 4 statuts : *À contacter · En négociation · Conclu · Perdu* |
| 🎫 **Tickets** | Système de support : les clients créent un ticket **sans compte** via un lien public — l'admin les consulte et change leur statut depuis son tableau de bord |

---

## 🛠️ Stack technique

```
Frontend  →  Next.js 15 (App Router) + React
Styling   →  Tailwind CSS v4
Backend   →  Supabase (PostgreSQL + Auth)
Sécurité  →  Row Level Security (RLS) — multi-tenant par user_id
Déploiement → Vercel (preview sur `dev`, production sur `main`)
```

---

## 🗂️ Structure du projet

```
OnBoarder/
│
├── app/
│   ├── page.tsx              # Dashboard
│   ├── login/                # Page de connexion
│   ├── entreprises/          # CRUD entreprises
│   ├── contacts/             # CRUD contacts
│   ├── opportunites/         # Pipeline des deals
│   ├── tickets/              # Tableau de bord admin tickets
│   └── ticket-client/        # Page publique client (sans compte)
│
├── lib/
│   └── supabase.ts           # Client Supabase partagé
│
├── migrations/
│   ├── 001_create_companies.sql
│   ├── 002_create_contacts.sql
│   ├── 003_create_deals.sql
│
└── public/                   # Icônes de navigation
```

---

## 🗄️ Base de données (Supabase)

Toutes les tables sont **multi-tenant** : chaque utilisateur ne voit que ses propres données, grâce aux politiques RLS.

```
auth.users          ← géré par Supabase Auth
    │
    ├── companies   (id, user_id, name, website)
            │
            └── contacts  (id, user_id, company_id, full_name, email, phone)
                    │
                    └── deals  (id, user_id, contact_id, title, amount, status)


### Politiques RLS par table

| Table | INSERT | SELECT | UPDATE / DELETE |
|---|---|---|---|
| `companies` | Propriétaire uniquement | Propriétaire uniquement | Propriétaire uniquement |
| `contacts` | Propriétaire uniquement | Propriétaire uniquement | Propriétaire uniquement |
| `deals` | Propriétaire uniquement | Propriétaire uniquement | Propriétaire uniquement |
---

## ⚙️ Installation locale

### Prérequis

- Node.js ≥ 18
- Un projet [Supabase](https://supabase.com/) créé

### 1. Cloner le projet

```bash
git clone https://github.com/<ton-username>/OnBoarder.git
cd OnBoarder
npm install
```

### 2. Configurer les variables d'environnement

Crée un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Ces valeurs sont disponibles dans **Supabase → Settings → API**.

### 3. Initialiser la base de données

Dans l'éditeur SQL de Supabase, exécute les fichiers **dans l'ordre** :

```
migrations/001_create_companies.sql
migrations/002_create_contacts.sql
migrations/003_create_deals.sql
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🚀 Déploiement (Vercel)

Le projet est déployé automatiquement via Vercel :

- **Branche `main`** → Production
- **Branche `dev`** → Environnement de preview

Les variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`) doivent être configurées dans les paramètres du projet Vercel.

---

## 📐 Choix de conception

- **Pas de sur-ingénierie** : pas de Redux, pas d'ORM, pas de layer service inutile. Les appels Supabase sont faits directement dans les composants React.
- **Sécurité by design** : RLS activé sur toutes les tables dès la création. Aucune donnée n'est exposée sans contrôle.
- **Tickets sans auth** : le rôle `anon` de Supabase est utilisé pour permettre aux clients de créer un ticket sans créer de compte, tout en maintenant la sécurité sur les autres tables.
- **Code commenté en français** : chaque composant et chaque requête sont documentés pour rester lisibles et maintenables.

---

<div align="center">

Projet réalisé dans le cadre du cours **MSD — Mise en situation dev**
avec **Graven** · Mai 2026

</div>
