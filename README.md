# Plateforme SaaS de Portails Captifs Wi-Fi avec IA Générative 📡🤖

Bienvenue dans le dépôt du projet de gestion de portails captifs intelligents. Ce projet a été développé dans le cadre d'un stage d'été. Il permet de configurer, designer et optimiser les portails captifs des clients (cafés, hôtels, boutiques, supermarchés) de manière centralisée, avec une prévisualisation mobile en temps réel et un assistant d'intelligence artificielle intégré.

---

## 🛠️ Stack Technique

- **Framework** : React + Next.js 14 (App Router)
- **Design & CSS** : Tailwind CSS (avec charte premium, animations, flous de verre et thème sombre)
- **Base de Données** : MongoDB + Mongoose (avec repli local JSON)
- **Traitement IA** : SDK Google Generative AI (modèle `gemini-1.5-flash`)
- **Bibliothèque d'Icônes** : Lucide React

---

## ✨ Fonctionnalités Clés

1. **Dashboard Centralisé** : Suivi des indicateurs clés (KPIs), métriques de connexions simulées par un graphique SVG dynamique et historique des dernières activités.
2. **Gestion des Clients (CRUD)** : Enregistrement des clients par secteur d'activité (Hôtel, Café, Restaurant, Supermarché, Boutique, etc.).
3. **Studio Design Interactif** :
   - Personnalisation visuelle manuelle (templates, palette de couleurs, logos, bannières, conditions RGPD).
   - Simulateur de smartphone interactif avec rendu instantané des changements.
   - Recommandations ergonomiques en temps réel (détection de contrastes insuffisants, longueur de texte, conformité RGPD).
4. **Assistant IA Génératif (Gemini)** :
   - Modification du design ou du contenu en langage naturel français (ex: *"mets un bouton rouge et un style minimalist"*).
   - Génération complète de portail adaptée selon le secteur d'activité (ex: *"génère un portail moderne pour une boutique"*).
5. **Historique des Versions & Restauration** : Sauvegarde automatique de chaque version à chaque publication avec possibilité de restaurer n'importe quelle version en un clic.
6. **API Ouverte pour Routeurs (GlobalNet)** :
   - `GET /api/portal/[slug]` : API publique retournant le JSON de configuration active pour le hardware réseau.
   - `POST /api/portal/[slug]` : API de journalisation des connexions depuis le portail.
7. **Portail Captif Public Simulée** : URL `/portal/[slug]` accessible par les clients finaux lors d'une redirection, validant la connexion réseau et insérant une statistique dans la plateforme.

---

## 💾 Mode d'Exécution Hybride (Idéal pour la soutenance/présentation)

Pour faciliter le lancement immédiat du projet par votre encadrant sans nécessiter d'installations lourdes, deux fonctionnalités hybrides innovantes ont été intégrées :

### 1. Stockage Hybride (MongoDB ⇆ JSON local)
L'adaptateur unifié `src/lib/db.js` bascule automatiquement le stockage :
- **Si `MONGODB_URI` est définie** dans `.env.local` : Connexion directe à MongoDB (Atlas ou local) via Mongoose.
- **Si `MONGODB_URI` n'est pas définie** : L'application stocke les données dans un fichier local du projet (`data/local_db.json`). Le comportement de l'application reste rigoureusement le même.

### 2. IA Hybride (Gemini API ⇆ Parser NLP Local)
Le service `src/lib/aiService.js` gère le traitement en langage naturel :
- **Si `GEMINI_KEY` est configurée** : Les invites sont analysées en temps réel par le LLM Google Gemini (modèle ultra-rapide 1.5 Flash).
- **Si aucune clé n'est fournie** : Un analyseur de règles local basé sur des correspondances sémantiques en français prend le relais. Il reconnaît instantanément les commandes de couleurs, de templates, de types d'authentification et de thèmes sectoriels.

---

## 🚀 Installation & Lancement

### 1. Cloner le projet ou ouvrir le dossier

```bash
cd projet-treetronix
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement (Optionnel)

Créez un fichier `.env.local` à la racine du projet pour activer MongoDB et l'IA réelle :

```env
# Clé de l'API Google Gemini (Gratuite et très simple à obtenir sur Google AI Studio)
GEMINI_API_KEY=votre_cle_gemini_api

# Base de données MongoDB (Si laissé vide, le projet utilisera le stockage JSON local data/local_db.json)
MONGODB_URI=mongodb+srv://...

# URL de base de l'application (Pour l'API de redirection)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour tester la plateforme !

---

## 🔌 Schéma d'intégration GlobalNet / Hardware

Lorsqu'un utilisateur se connecte au Wi-Fi physique, le routeur doit :
1. Interroger l'API publique : `GET http://localhost:3000/api/portal/carrefour`
2. Récupérer la configuration renvoyée (couleurs, type d'auth, logo, etc.) :
   ```json
   {
     "client": "Carrefour",
     "slug": "carrefour",
     "portalId": "...",
     "logo": "...",
     "primaryColor": "#005baa",
     "authType": "email",
     "portalUrl": "http://localhost:3000/portal/carrefour"
   }
   ```
3. Rediriger l'utilisateur vers la valeur de `portalUrl`.
4. Une fois connecté sur la page du portail captif, le système enregistrera l'autorisation et loggera la connexion avec `POST http://localhost:3000/api/portal/carrefour`.
