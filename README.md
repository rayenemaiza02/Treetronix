# Treetronix SaaS — Plateforme de Portails Captifs Wi-Fi avec IA Générative 📡🤖

> **Treetronix SaaS** est une solution B2B complète et moderne développée avec **Next.js 14 (App Router)** et **Supabase (PostgreSQL Cloud)**. Elle permet aux établissements (hôtels, restaurants, boutiques, supermarchés, cafés) de concevoir, déployer et optimiser intelligemment leurs portails captifs Wi-Fi, avec une prévisualisation mobile temps réel (WYSIWYG) et un assistant d'intelligence artificielle intégré (**Google Gemini 1.5 Flash**).

---

## 🛠️ Stack Technique

* **Framework Fullstack** : React 18 & Next.js 14 (App Router, Server Actions & Route Handlers)
* **Design & UI** : Tailwind CSS (Glassmorphism Dark Premium, micro-interactions 60 FPS)
* **Icônes** : Lucide React
* **Base de Données Principale** : Supabase PostgreSQL Cloud (avec colonnes JSONB pour l'historique d'états)
* **Persistance Résiliente (Dual Adapter)** : Fallback automatique et transparent vers une base JSON locale (`data/local_db.json`)
* **Moteur IA Hybride** : Google Gemini 1.5 Flash (`@google/generative-ai`) + Fallback NLP / Algorithmique local
* **Moteurs Déterministes Dédiés** :
  * `analyticsEngine.js` : Calculs statistiques exacts en pur JavaScript (anti-hallucination)
  * `anomalyEngine.js` : Détection automatique de 5 anomalies réseau et ergonomiques

---

## ✨ Fonctionnalités Majeures

### 1. 📊 Tour de Contrôle Administrateur (`/dashboard`)
* Suivi des indicateurs clés (KPIs) : Total clients, portails actifs, volume de connexions.
* **Graphique SVG interactif sur 7 jours** : recalcul dynamique selon la base de données.
* Répartition en direct des méthodes d'authentification (*Bouton 1-clic, Email, Téléphone, Login, Voucher*).
* Classement des **portails les plus fréquentés** et journal d'audit des dernières modifications.

### 2. 📱 Studio Client & Simulateur Mobile WYSIWYG (`/client/[slug]`)
* **Simulateur smartphone live (format 9:41)** : Visualisation instantanée des couleurs, logos, bannières et textes légaux.
* Personnalisation fine : templates visuels (*Glassmorphism, Modern, Minimalist, Classic*), codes hexadécimaux et textes d'accueil.
* **Diagnostic d'anomalies en direct** : Alerte de contrastes insuffisants, conformité RGPD et chutes de fréquentation.
* **Simulateur de trafic réseau** : Bouton *« 🎲 Simuler 30 connexions Wi-Fi »* pour générer des données réalistes de test.

### 3. ✨ Treetronix AI Copilot (3 Propositions Métier)
* **Génération sur-mesure** à partir d'un brief (*Nom, Secteur, Style recherché, Objectif, Description*).
* Déclinaison instantanée de **3 concepts visuels et stratégiques distincts** :
  * *Concept 1 :* Prestige & Sombre (ambiance feutrée, contrastes forts)
  * *Concept 2 :* Lumineux & Warm (ambiance chaleureuse, accueil convivial)
  * *Concept 3 :* Épuré & Minimal (ergonomie sobre, accès rapide)
* **Catalogue d'Images Sectoriel HD** : Résoluteur sémantique couvrant **15 secteurs d'activité** (*Sport/Foot, Mode, Hôtels, Restaurants, Cafés, Pizzerias, Pharmacies, Automobile, Coworking, etc.*) avec visuels Unsplash HD.
* **Aperçu non-destructif** : Test direct dans le simulateur mobile sans impacter la base de données.

### 4. 🛡️ Application Sans Risque & Versioning Immuable
* **Snapshots automatiques pré-IA** : Chaque action IA ou manuelle archive l'état précédent dans `portal_histories`.
* **Incrémentation de version** : Historique traçable (*v1, v2, v3...*) avec auteur et horodatage.
* **Restauration en 1 clic** : Réversibilité totale conservée en base Supabase après rechargement de page.

### 5. 🔌 API Ouverte pour Matériel Réseau (GlobalNet / RADIUS)
* `GET /api/portal/[slug]` : API publique fournissant la configuration active au routeur Wi-Fi physique.
* `POST /api/portal/[slug]` : API de journalisation sécurisée des connexions visiteurs.

---

## 🏗️ Architecture du Projet

```
projet-treetronix/
├── src/
│   ├── app/
│   │   ├── page.js                     # Racine : redirection intelligente de session
│   │   ├── login/page.js               # Authentification sécurisée Admin / Client
│   │   ├── register/page.js            # Enregistrement d'un nouvel établissement
│   │   ├── dashboard/                  # Espace d'administration central
│   │   │   ├── page.js                 # KPIs, graphique 7 jours et top portails
│   │   │   ├── clients/page.js         # Gestion du parc clients (CRUD)
│   │   │   └── portals/page.js         # Supervision des portails
│   │   ├── client/[slug]/page.js       # Studio Client, AI Copilot & Simulateur
│   │   ├── portal/[slug]/page.js       # Portail captif public de connexion
│   │   └── api/                        # Routeurs et APIs Serverless Next.js
│   │       ├── ai/route.js             # Routeur central d'actions IA (POST /api/ai)
│   │       ├── portals/[id]/route.js   # CRUD portails & snapshots de version
│   │       ├── portals/.../restore/    # Restauration 1-clic immuable
│   │       └── stats/route.js          # Analytics & simulateur de trafic
│   └── lib/
│       ├── aiService.js                # Intégration Gemini 1.5 Flash + Fallback local + Pool 15 métiers
│       ├── analyticsEngine.js          # Moteur mathématique déterministe JS (0 hallucination)
│       ├── anomalyEngine.js            # Moteur de détection de 5 anomalies réseau
│       ├── db.js                       # Sélecteur de persistance résilient
│       ├── supabaseDb.js               # Adaptateur Supabase PostgreSQL
│       └── jsonDb.js                   # Moteur de secours local persistant
```

---

## 🚀 Démarrage Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/rayenemaiza02/Treetronix.git
cd Treetronix
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Variables d'environnement (`.env.local`)
Créez un fichier `.env.local` à la racine :
```env
# Supabase PostgreSQL Cloud
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=votre_cle_anon_ou_service_role

# Google Gemini AI (Optionnel — Fallback algorithmique local inclus)
GEMINI_API_KEY=votre_cle_api_gemini

# URL de base de l'application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Lancer le serveur
```bash
npm run dev
```
Accédez à l'application sur [http://localhost:3000](http://localhost:3000).

---

## 📄 Licence & Crédits
Projet développé dans le cadre des solutions SaaS de portails captifs intelligents **Treetronix** en partenariat avec l'opérateur réseau **GlobalNet**.
