// ============================================================
// AI Service: Hybrid Google Gemini + Local NLP Fallback
// ============================================================

// ---- Local NLP Fallback (no API key needed) ----

const COLOR_MAP = {
  // French color names → hex
  rouge: '#ef4444', red: '#ef4444',
  vert: '#22c55e', green: '#22c55e',
  bleu: '#3b82f6', blue: '#3b82f6',
  jaune: '#eab308', yellow: '#eab308',
  orange: '#f97316',
  violet: '#8b5cf6', purple: '#8b5cf6',
  rose: '#ec4899', pink: '#ec4899',
  blanc: '#f8fafc', white: '#f8fafc',
  noir: '#0f172a', black: '#0f172a',
  gris: '#6b7280', gray: '#6b7280', grey: '#6b7280',
  cyan: '#06b6d4', turquoise: '#14b8a6',
  indigo: '#6366f1', magenta: '#d946ef',
  marron: '#92400e', brown: '#92400e',
  beige: '#d4c5a9',
};

const SECTOR_TEMPLATES = {
  hotel: {
    templateName: 'glassmorphism',
    primaryColor: '#c49a6c',
    backgroundColor: '#1a0a00',
    textColor: '#faf5e4',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600',
    welcomeText: 'Bienvenue dans notre établissement. Profitez de notre Wi-Fi haut débit.',
    buttonText: 'Accéder à Internet',
    authType: 'email',
  },
  café: {
    templateName: 'modern',
    primaryColor: '#d97706',
    backgroundColor: '#1c0e00',
    textColor: '#fef3c7',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600',
    welcomeText: 'Bienvenue ! Connectez-vous et profitez de votre café.',
    buttonText: 'Se connecter',
    authType: 'button',
  },
  cafe: {
    templateName: 'modern',
    primaryColor: '#d97706',
    backgroundColor: '#1c0e00',
    textColor: '#fef3c7',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600',
    welcomeText: 'Bienvenue ! Connectez-vous et profitez de votre café.',
    buttonText: 'Se connecter',
    authType: 'button',
  },
  restaurant: {
    templateName: 'modern',
    primaryColor: '#f97316',
    backgroundColor: '#1a0900',
    textColor: '#fff7ed',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600',
    welcomeText: 'Bienvenue dans notre restaurant. Bon appétit !',
    buttonText: 'Me connecter',
    authType: 'button',
  },
  supermarché: {
    templateName: 'minimalist',
    primaryColor: '#005baa',
    backgroundColor: '#0f1f3a',
    textColor: '#e0f0ff',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600',
    welcomeText: 'Bienvenue ! Connectez-vous au Wi-Fi du magasin.',
    buttonText: 'Connexion gratuite',
    authType: 'email',
  },
  supermarche: {
    templateName: 'minimalist',
    primaryColor: '#005baa',
    backgroundColor: '#0f1f3a',
    textColor: '#e0f0ff',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600',
    welcomeText: 'Bienvenue ! Connectez-vous au Wi-Fi du magasin.',
    buttonText: 'Connexion gratuite',
    authType: 'email',
  },
  boutique: {
    templateName: 'glassmorphism',
    primaryColor: '#d946ef',
    backgroundColor: '#1a0030',
    textColor: '#fce7f3',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
    welcomeText: 'Bienvenue dans notre boutique. Profitez du Wi-Fi gratuit !',
    buttonText: 'Connecter',
    authType: 'button',
  },
  vêtements: {
    templateName: 'glassmorphism',
    primaryColor: '#d946ef',
    backgroundColor: '#1a0030',
    textColor: '#fce7f3',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
    welcomeText: 'Bienvenue dans notre boutique de mode. Profitez du Wi-Fi gratuit !',
    buttonText: 'Se connecter',
    authType: 'button',
  },
  vetements: {
    templateName: 'glassmorphism',
    primaryColor: '#d946ef',
    backgroundColor: '#1a0030',
    textColor: '#fce7f3',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
    welcomeText: 'Bienvenue dans notre boutique de mode. Profitez du Wi-Fi gratuit !',
    buttonText: 'Se connecter',
    authType: 'button',
  },
  default: {
    templateName: 'glassmorphism',
    primaryColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    backgroundImageUrl: '',
    welcomeText: 'Bienvenue ! Connectez-vous à notre réseau Wi-Fi.',
    buttonText: 'Se connecter',
    authType: 'button',
  },
};

function parseColorFromText(text) {
  const lower = text.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name)) return hex;
  }
  // Try to detect hex color in text
  const hexMatch = lower.match(/#[0-9a-f]{3,6}/);
  if (hexMatch) return hexMatch[0];
  return null;
}

function localModify(instructions, currentConfig) {
  const text = instructions.toLowerCase();
  const result = { ...currentConfig };
  const changes = [];

  // --- Background color ---
  const bgKeywords = ['fond', 'arrière-plan', 'arriere-plan', 'background', 'bg'];
  const darkKeywords = ['sombre', 'dark', 'noir', 'foncé', 'fonce', 'nuit', 'night'];
  const lightKeywords = ['clair', 'light', 'blanc', 'bright', 'lumineux'];

  const hasBg = bgKeywords.some(k => text.includes(k));
  const isDark = darkKeywords.some(k => text.includes(k));
  const isLight = lightKeywords.some(k => text.includes(k));

  if (isDark && hasBg) {
    result.backgroundColor = '#0f172a';
    result.textColor = '#f8fafc';
    changes.push('Fond sombre appliqué');
  } else if (isLight && hasBg) {
    result.backgroundColor = '#f8fafc';
    result.textColor = '#0f172a';
    changes.push('Fond clair appliqué');
  } else if (isDark && !hasBg) {
    result.backgroundColor = '#0f172a';
    result.textColor = '#f8fafc';
    changes.push('Thème sombre appliqué');
  } else if (isLight && !hasBg) {
    result.backgroundColor = '#f0f4f8';
    result.textColor = '#1e293b';
    changes.push('Thème clair appliqué');
  }

  // --- Background image ---
  const hasImage = text.includes('image') || text.includes('photo') || text.includes('background-image') || text.includes('fond d\'ecran') || text.includes('fond d\'écran');
  if (hasImage) {
    if (text.includes('enlever') || text.includes('supprimer') || text.includes('sans') || text.includes('retirer') || text.includes('pas d\'image')) {
      result.backgroundImageUrl = '';
      changes.push('Image de fond retirée');
    } else {
      if (text.includes('hotel') || text.includes('hôtel') || text.includes('chambre')) {
        result.backgroundImageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600';
        changes.push('Image de fond Hôtel appliquée');
      } else if (text.includes('cafe') || text.includes('café') || text.includes('tasse')) {
        result.backgroundImageUrl = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600';
        changes.push('Image de fond Café appliquée');
      } else if (text.includes('restaurant') || text.includes('plat') || text.includes('table')) {
        result.backgroundImageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600';
        changes.push('Image de fond Restaurant appliquée');
      } else if (text.includes('boutique') || text.includes('magasin') || text.includes('vetement') || text.includes('vêtement') || text.includes('mode')) {
        result.backgroundImageUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600';
        changes.push('Image de fond Boutique appliquée');
      } else if (text.includes('supermarche') || text.includes('supermarché') || text.includes('course')) {
        result.backgroundImageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600';
        changes.push('Image de fond Supermarché appliquée');
      } else {
        const urlMatch = instructions.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
          result.backgroundImageUrl = urlMatch[0];
          changes.push('Image de fond personnalisée appliquée via URL');
        } else {
          result.backgroundImageUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600';
          changes.push('Image de fond abstraite par défaut appliquée');
        }
      }
    }
  }

  // --- Button color ---
  const btnKeywords = ['bouton', 'button', 'btn'];
  const hasBtnContext = btnKeywords.some(k => text.includes(k));

  // Find color mentions near "bouton"
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (text.includes(name)) {
      if (hasBtnContext) {
        result.primaryColor = hex;
        changes.push(`Couleur du bouton changée en ${name} (${hex})`);
      } else if (text.includes('couleur') || text.includes('color') || text.includes('teinte') || text.includes('palette')) {
        result.primaryColor = hex;
        changes.push(`Couleur principale changée en ${name} (${hex})`);
      }
    }
  }

  // --- Authentication type ---
  if (text.includes('email') || text.includes('mail')) {
    result.authType = 'email';
    changes.push("Type d'authentification changé en Email");
  } else if (text.includes('téléphone') || text.includes('telephone') || text.includes('phone') || text.includes('sms')) {
    result.authType = 'phone';
    changes.push("Type d'authentification changé en Téléphone");
  } else if (text.includes('mot de passe') || text.includes('password') || text.includes('login')) {
    result.authType = 'login';
    changes.push("Type d'authentification changé en Login/Mot de passe");
  } else if (text.includes('voucher') || text.includes('code') || text.includes('coupon')) {
    result.authType = 'voucher';
    changes.push("Type d'authentification changé en Voucher");
  } else if (text.includes('simple') || text.includes('clic') || text.includes('click')) {
    result.authType = 'button';
    changes.push("Type d'authentification changé en Bouton simple");
  }

  // --- Template style ---
  if (text.includes('glassmorphism') || text.includes('verre') || text.includes('glass') || text.includes('transparent')) {
    result.templateName = 'glassmorphism';
    changes.push('Template Glassmorphism appliqué');
  } else if (text.includes('moderne') || text.includes('modern')) {
    result.templateName = 'modern';
    changes.push('Template Modern appliqué');
  } else if (text.includes('minimaliste') || text.includes('minimalist') || text.includes('épuré') || text.includes('epure')) {
    result.templateName = 'minimalist';
    changes.push('Template Minimaliste appliqué');
  } else if (text.includes('classique') || text.includes('classic')) {
    result.templateName = 'classic';
    changes.push('Template Classique appliqué');
  }

  // --- Welcome text ---
  const welcomeMatch = text.match(/texte d'accueil[:\s]+"?([^"]+)"?/i) 
    || text.match(/welcome text[:\s]+"?([^"]+)"?/i);
  if (welcomeMatch) {
    result.welcomeText = welcomeMatch[1].trim();
    changes.push("Texte d'accueil modifié");
  }

  // --- Button text ---
  const btnTextMatch = text.match(/texte du bouton[:\s]+"?([^"]+)"?/i)
    || text.match(/button text[:\s]+"?([^"]+)"?/i);
  if (btnTextMatch) {
    result.buttonText = btnTextMatch[1].trim();
    changes.push('Texte du bouton modifié');
  }

  return {
    config: result,
    changes: changes.length > 0 ? changes : ['Aucune modification spécifique reconnue. Essayez: "bouton vert", "fond sombre", "image de fond café"...'],
    method: 'local-parser'
  };
}

function localGenerate(sector, clientName, businessGoalPrompt = '') {
  const sectorKey = (sector || '').toLowerCase().replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e');
  const template = { ...(SECTOR_TEMPLATES[sectorKey] || SECTOR_TEMPLATES['default']) };
  
  const promptLower = (businessGoalPrompt || '').toLowerCase();
  let authType = template.authType;
  let primaryColor = template.primaryColor;
  let bgImage = template.backgroundImageUrl;
  let welcomeText = template.welcomeText;
  let buttonText = template.buttonText;
  let templateName = template.templateName;

  // Intelligent Concept & Sector Copywriting
  if (promptLower.includes('italien') || promptLower.includes('pizza') || promptLower.includes('pâtes') || promptLower.includes('trattoria')) {
    welcomeText = `Bienvenue chez ${clientName || 'notre Trattoria'}. Savourez nos authentiques spécialités italiennes et profitez de notre accès Wi-Fi haut débit.`;
    buttonText = "Accéder au Wi-Fi & Commander";
    primaryColor = "#e11d48";
    bgImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600";
    templateName = "modern";
  } else if (promptLower.includes('hotel') || promptLower.includes('luxe') || promptLower.includes('resort') || promptLower.includes('séjour') || promptLower.includes('chambre')) {
    welcomeText = `Bienvenue à ${clientName || 'l\'Hôtel'}. Nous vous souhaitons un d'exceptionnel séjour. Profitez de notre réseau Wi-Fi haut débit gratuit.`;
    buttonText = "Connexion Résidents Wi-Fi";
    primaryColor = "#d97706";
    bgImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600";
    templateName = "glassmorphism";
  } else if (promptLower.includes('café') || promptLower.includes('coffee') || promptLower.includes('coworking') || promptLower.includes('bureau') || promptLower.includes('express')) {
    welcomeText = `Bienvenue chez ${clientName || 'notre Café'}. Installez-vous confortablement, savourez votre boisson et naviguez en toute liberté.`;
    buttonText = "Se Connecter au Wi-Fi Café";
    primaryColor = "#d97706";
    bgImage = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600";
    templateName = "modern";
  } else if (promptLower.includes('supermarché') || promptLower.includes('magasin') || promptLower.includes('course') || promptLower.includes('promo') || promptLower.includes('solde')) {
    welcomeText = `Bienvenue chez ${clientName || 'nous'} ! Découvrez nos meilleures promotions en rayon tout en profitant de votre Wi-Fi gratuit.`;
    buttonText = "Activer Mon Accès Wi-Fi";
    primaryColor = "#005baa";
    bgImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600";
    templateName = "minimalist";
  } else if (promptLower.includes('boutique') || promptLower.includes('mode') || promptLower.includes('vêtement') || promptLower.includes('shopping')) {
    welcomeText = `Bienvenue chez ${clientName || 'votre boutique'}. Découvrez nos collections exclusives et profitez d'une connexion Wi-Fi rapide.`;
    buttonText = "Profiter du Wi-Fi Shopping";
    primaryColor = "#d946ef";
    bgImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600";
    templateName = "glassmorphism";
  } else if (businessGoalPrompt && businessGoalPrompt.length > 3) {
    welcomeText = `Bienvenue chez ${clientName || 'nous'}. Profitez d'une expérience Wi-Fi d'exception et restez connecté durant toute votre visite.`;
  }

  // Auth Type Strategy
  if (promptLower.includes('sms') || promptLower.includes('téléphone') || promptLower.includes('phone') || promptLower.includes('mobile')) {
    authType = 'phone';
  } else if (promptLower.includes('email') || promptLower.includes('mail') || promptLower.includes('prospect') || promptLower.includes('contact')) {
    authType = 'email';
  } else if (promptLower.includes('voucher') || promptLower.includes('code') || promptLower.includes('ticket')) {
    authType = 'voucher';
  }

  return {
    config: {
      ...template,
      name: `Portail ${clientName || 'Client'}`,
      primaryColor,
      templateName,
      backgroundImageUrl: bgImage,
      authType,
      welcomeText,
      buttonText,
      termsOfUse: `En vous connectant au réseau Wi-Fi de ${clientName || 'l\'établissement'}, vous acceptez les conditions d'utilisation et la politique de confidentialité RGPD.`
    },
    explanation: `Portail généré sur-mesure pour "${clientName || 'votre enseigne'}" avec rédactionnel et identité visuelle adaptés.`,
    method: 'local-generator'
  };
}

function localRecommend(config) {
  const suggestions = [];

  // Check contrast
  const bg = config.backgroundColor || '#0f172a';
  const primary = config.primaryColor || '#8b5cf6';

  if (bg === '#f8fafc' && primary === '#f8fafc') {
    suggestions.push({
      id: 'contrast-btn',
      type: 'warning',
      title: 'Bouton peu visible',
      message: 'La couleur du bouton est trop proche du fond. Changez-la pour améliorer la lisibilité.',
      fix: { primaryColor: '#8b5cf6' }
    });
  }

  if ((config.welcomeText || '').length > 120) {
    suggestions.push({
      id: 'text-length',
      type: 'info',
      title: "Texte d'accueil trop long",
      message: "Réduisez le texte à moins de 100 caractères pour une meilleure expérience mobile.",
      fix: null
    });
  }

  if (!config.logoUrl) {
    suggestions.push({
      id: 'missing-logo',
      type: 'info',
      title: 'Logo manquant',
      message: 'Ajouter un logo renforcera la confiance et l\'identité visuelle de votre portail.',
      fix: null
    });
  }

  if (config.authType === 'button') {
    suggestions.push({
      id: 'auth-upgrade',
      type: 'suggestion',
      title: 'Collecte de données',
      message: 'Passer à une authentification par email vous permettrait de collecter des contacts clients.',
      fix: { authType: 'email' }
    });
  }

  if (!config.termsOfUse || config.termsOfUse.length < 20) {
    suggestions.push({
      id: 'missing-terms',
      type: 'warning',
      title: "Conditions d'utilisation manquantes",
      message: "Pour être conforme au RGPD, ajoutez des conditions d'utilisation explicites.",
      fix: null
    });
  }

  return suggestions;
}

// ---- Gemini API Integration ----

async function geminiModify(instructions, currentConfig, analyticsSummary = '') {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const analyticsContextPrompt = analyticsSummary 
    ? `\nCONSTAT ET MÉTRIQUES REELLES DU PORTAIL (FAITS EXACTES CALCULÉS PAR LE MOTEUR JS, NE LES RÉ-CALCULE PAS) :\n${analyticsSummary}\n` 
    : '';

  const prompt = `Tu es un assistant de personnalisation de portails captifs Wi-Fi. 
L'utilisateur demande: "${instructions}"
${analyticsContextPrompt}
La configuration actuelle du portail est:
${JSON.stringify(currentConfig, null, 2)}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks, sans explication) contenant SEULEMENT les champs à modifier parmi:
- primaryColor (string hex)
- backgroundColor (string hex)
- textColor (string hex)
- welcomeText (string)
- buttonText (string)
- authType ("button" | "login" | "email" | "phone" | "voucher")
- templateName ("glassmorphism" | "modern" | "minimalist" | "classic")
- logoUrl (string URL)
- backgroundImageUrl (string URL)
- termsOfUse (string)

Exemple de réponse: {"primaryColor": "#22c55e", "buttonText": "Accéder"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');
  
  const modifications = JSON.parse(jsonMatch[0]);
  const config = { ...currentConfig, ...modifications };

  return {
    config,
    changes: Object.keys(modifications).map(k => `${k} modifié`),
    method: 'gemini'
  };
}

async function geminiGenerate(sector, clientName, businessGoalPrompt = '') {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Tu es un Directeur Artistique et Rédacteur Marketing Senior spécialisé dans les portails captifs Wi-Fi d'établissements.

INFORMATIONS CLIENT :
Secteur d'activité : "${sector || 'Général'}"
Nom de l'établissement : "${clientName || 'Notre Établissement'}"
Intention / Concept exprimé par le client : "${businessGoalPrompt || `Créer un portail Wi-Fi moderne et attrayant`}"

CONSIGNE RÉDACTIONNELLE STRICTE :
- Ne répète JAMAIS la consigne brute de l'utilisateur dans le texte d'accueil !
- Réalise un VRAI travail de rédaction publicitaire élégant et chaleureux en français destiné aux clients de l'établissement.
- Choisis une palette de couleurs élégante (fond sombre, bouton percutant, texte lisible).
- Sélectionne une URL de photo Unsplash HD en lien avec le concept.

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec cette structure exacte:
{
  "config": {
    "name": "Portail Captif ${clientName || 'Client'}",
    "primaryColor": "couleur hex percutante pour le bouton (ex: #8b5cf6, #e11d48, #22c55e, #d97706, #005baa, #d946ef)",
    "backgroundColor": "couleur hex de fond sombre très élégante (ex: #0f172a, #1a0a00, #0f1f3a, #1a0030)",
    "textColor": "couleur hex du texte parfaitement lisible (ex: #f8fafc, #fef3c7, #faf5e4)",
    "welcomeText": "phrase d'accueil commerciale élégante et chaleureuse en français destinée aux clients (80-120 caractères max). PAS la consigne brute!",
    "buttonText": "texte du bouton d'action CTA incitatif (ex: 'Profiter du Wi-Fi Gratuit', 'Se Connecter & Naviguer', 'Activer Mon Accès')",
    "authType": "button | email | phone | login | voucher",
    "templateName": "glassmorphism | modern | minimalist | classic",
    "backgroundImageUrl": "URL Unsplash HD valide en rapport avec le concept",
    "promoBannerUrl": "URL Unsplash HD d'une offre promo (ou chaîne vide)",
    "termsOfUse": "mentions légales RGPD d'information claires et complètes en français"
  },
  "explanation": "Explication synthétique et enthousiaste de la direction artistique et rédactionnelle choisie (2-3 phrases en français)."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const config = parsed.config || parsed;
  return {
    config,
    explanation: parsed.explanation || `Portail généré pour "${clientName}" dans le secteur "${sector}".`,
    method: 'gemini'
  };
}

// ---- Gemini Optimization Integration ----

function localOptimize(currentConfig, analyticsData = {}) {
  const result = { ...currentConfig };
  const changes = [];
  const insights = [];

  const { totalConnections = 0, successRate = 100 } = analyticsData;

  // Rule 1: Upgrade single-click to email auth when traffic is present
  if (currentConfig.authType === 'button' && totalConnections >= 3) {
    result.authType = 'email';
    changes.push("Type d'authentification optimisé en Email pour la collecte de prospects");
    insights.push(`Avec ${totalConnections} connexions enregistrées, passer du bouton 1-clic à la collecte par Email vous permettra de constituer une base de fidélisation.`);
  }

  // Rule 2: Simplify auth if success rate is low (< 80%)
  if (successRate < 80 && currentConfig.authType !== 'button') {
    result.authType = 'button';
    changes.push("Passage en 1-clic pour éliminer la friction et maximiser le taux d'accès");
    insights.push(`Le taux de réussite de connexion actuel (${successRate}%) montre une perte d'utilisateurs. Le mode 1-clic rétablit un accès instantané.`);
  }

  // Rule 3: Add promo banner for active portal
  if (totalConnections >= 5 && !currentConfig.promoBannerUrl) {
    result.promoBannerUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600';
    changes.push("Bannière promotionnelle activée pour capter l'attention des utilisateurs");
    insights.push("Votre fréquentation est active. L'ajout d'une bannière promo met en valeur vos offres dès la connexion.");
  }

  if (changes.length === 0) {
    result.templateName = 'glassmorphism';
    result.primaryColor = '#8b5cf6';
    changes.push('Design ajusté vers le style Glassmorphism Premium');
    insights.push('Votre portail est déjà bien équilibré. Nous avons affiné le contraste et le style visuel.');
  }

  return {
    config: result,
    changes,
    explanation: insights.join(' '),
    method: 'local-optimizer'
  };
}

async function geminiOptimize(currentConfig, analyticsData = {}) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const analyticsSummary = analyticsData.formattedSummaryForAi || '';

  const prompt = `Tu es un expert mondial en optimisation de conversion et UX pour les portails captifs Wi-Fi.

MÉTRIQUES ET STATISTIQUES RÉELLES DU PORTAIL (FAITS DÉTERMINISTES CALCULÉS PAR LE SERVEUR) :
${analyticsSummary}

CONFIGURATION ACTUELLE DU PORTAIL :
${JSON.stringify(currentConfig, null, 2)}

TA MISSION :
Analyse les performances réelles du portail par rapport à sa configuration actuelle.
Par exemple:
- Si l'authentification est en "button" (un-clic) et qu'il y a des connexions, suggère de passer en "email" ou "phone" pour capturer des prospects précieux.
- Si le taux de réussite est faible, simplifie l'authentification.
- Si la fréquentation est forte, recommande d'ajouter une bannière promo ou d'optimiser le texte d'accueil.

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec cette structure exact:
{
  "modifications": {
    "authType": "button | email | phone | login | voucher (optionnel)",
    "primaryColor": "couleur hex (optionnel)",
    "templateName": "glassmorphism | modern | minimalist | classic (optionnel)",
    "welcomeText": "texte révisé (optionnel)",
    "buttonText": "texte du bouton révisé (optionnel)"
  },
  "explanation": "Explication stratégique claire en français (2-3 phrases) basée directement sur les faits analytics réels."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const modifications = parsed.modifications || {};
  const config = { ...currentConfig, ...modifications };

  return {
    config,
    changes: Object.keys(modifications).map(k => `${k} optimisé`),
    explanation: parsed.explanation || 'Portail optimisé avec succès selon les métriques réelles.',
    method: 'gemini-optimizer'
  };
}

export async function optimizePortal(currentConfig, analyticsData = {}) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiOptimize(currentConfig, analyticsData);
    } catch (err) {
      console.warn('Gemini API error, falling back to local optimizer:', err.message);
    }
  }
  return localOptimize(currentConfig, analyticsData);
}

// ---- Public API ----

export async function modifyPortal(instructions, currentConfig, analyticsSummary = '') {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiModify(instructions, currentConfig, analyticsSummary);
    } catch (err) {
      console.warn('Gemini API error, falling back to local parser:', err.message);
    }
  }
  return localModify(instructions, currentConfig);
}

export async function generatePortal(sector, clientName, businessGoalPrompt = '') {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiGenerate(sector, clientName, businessGoalPrompt);
    } catch (err) {
      console.warn('Gemini API error, falling back to local generator:', err.message);
    }
  }
  return localGenerate(sector, clientName, businessGoalPrompt);
}

export function recommendPortalImprovements(config) {
  return localRecommend(config);
}

// ---- 3-Variant Copilot AI Generator & Sanitization ----

const ALLOWED_AUTH_TYPES = ['button', 'email', 'phone', 'login', 'voucher'];
const ALLOWED_TEMPLATES = ['glassmorphism', 'modern', 'minimalist', 'classic', 'minimal'];
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const SECTOR_IMAGE_MAP = [
  {
    keywords: ['foot', 'football', 'sport', 'stade', 'maillot', 'taraji', 'equipe de foot', 'équipe de foot', 'fitness', 'gym', 'padel', 'tennis'],
    images: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=800',
    ]
  },
  {
    keywords: ['boutique', 'vêtement', 'vetement', 'mode', 'habille', 'shopping', 'store', 'magasin', 'habillements', 'prêt-à-porter'],
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800',
      'https://images.unsplash.com/photo-1441984518175-9e6b45388c3a?q=80&w=800',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
    ]
  },
  {
    keywords: ['coiffure', 'coiffeur', 'barber', 'barbier', 'beauté', 'beaute', 'esthétique', 'spa', 'massage', 'onglerie'],
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    ]
  },
  {
    keywords: ['pizza', 'pizzeria', 'italien', 'trattoria', 'burger', 'fast food', 'tacos', 'snack'],
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
      'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=800',
    ]
  },
  {
    keywords: ['café', 'cafe', 'coffee', 'bistro', 'salon de thé', 'thé'],
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800',
    ]
  },
  {
    keywords: ['boulangerie', 'pâtisserie', 'patisserie', 'pain', 'croissant', 'gâteau', 'gateau'],
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=800',
    ]
  },
  {
    keywords: ['restaurant', 'gastronomie', 'brasserie', 'food', 'manger', 'gourmet'],
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800',
    ]
  },
  {
    keywords: ['hôtel', 'hotel', 'resort', 'gîte', 'maison d\'hôte'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800',
    ]
  },
  {
    keywords: ['pharmacie', 'clinique', 'médecin', 'dentiste', 'santé', 'sante', 'médical'],
    images: [
      'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=800',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800',
    ]
  },
  {
    keywords: ['auto', 'automobile', 'concession', 'garage', 'voiture', 'lavage'],
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800',
    ]
  },
  {
    keywords: ['supermarché', 'supermarche', 'market', 'épicerie', 'epicerie', 'carrefour'],
    images: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800',
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=800',
    ]
  },
  {
    keywords: ['coworking', 'tech', 'startup', 'bureau', 'informatique', 'agence'],
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800',
    ]
  },
  {
    keywords: ['immobilier', 'villa', 'appartement', 'architecture'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800',
    ]
  },
  {
    keywords: ['bijouterie', 'bijoux', 'joaillerie', 'horlogerie', 'montre'],
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800',
    ]
  },
  {
    keywords: ['optique', 'opticien', 'lunettes', 'lunetterie'],
    images: [
      'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=800',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800',
      'https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=800',
    ]
  }
];

function resolveUnsplashImagesForVariants(sector = '', name = '', description = '') {
  const fullText = `${sector} ${name} ${description}`.toLowerCase();
  for (const entry of SECTOR_IMAGE_MAP) {
    if (entry.keywords.some(k => fullText.includes(k))) {
      return entry.images;
    }
  }
  return [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800',
    'https://images.unsplash.com/photo-1441984518175-9e6b45388c3a?q=80&w=800',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800'
  ];
}

function isValidHexColor(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return false;
  return HEX_COLOR_REGEX.test(colorStr.trim());
}

export function validateVariantsResponse(rawData, payload = {}) {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('La réponse du moteur IA est invalide ou vide.');
  }

  let variantsList = rawData.variants;
  if (!Array.isArray(variantsList) || variantsList.length === 0) {
    throw new Error('La réponse IA ne contient pas la liste "variants" attendue.');
  }

  if (variantsList.length > 3) {
    variantsList = variantsList.slice(0, 3);
  }

  const sectorImages = resolveUnsplashImagesForVariants(payload.sector, payload.clientName, payload.description);

  const validatedVariants = variantsList.map((v, idx) => {
    if (!v || typeof v !== 'object') {
      throw new Error(`La variante ${idx + 1} est malformée.`);
    }

    const name = (v.name || `Concept ${idx + 1}`).slice(0, 60);
    const description = (v.description || `Concept de design pour ${payload.clientName || 'votre portail'}`).slice(0, 180);
    const rawConfig = v.config || {};
    const rawExplanation = v.explanation || {};

    const primaryColor = isValidHexColor(rawConfig.primaryColor) ? rawConfig.primaryColor.trim() : '#8b5cf6';
    const backgroundColor = isValidHexColor(rawConfig.backgroundColor) ? rawConfig.backgroundColor.trim() : '#0f172a';
    const textColor = isValidHexColor(rawConfig.textColor) ? rawConfig.textColor.trim() : '#f8fafc';

    const authTypeRaw = (rawConfig.authType || 'button').toLowerCase();
    const authType = ALLOWED_AUTH_TYPES.includes(authTypeRaw) ? authTypeRaw : 'email';

    let templateNameRaw = (rawConfig.templateName || 'glassmorphism').toLowerCase();
    if (templateNameRaw === 'minimal') templateNameRaw = 'minimalist';
    const templateName = ALLOWED_TEMPLATES.includes(templateNameRaw) ? templateNameRaw : 'glassmorphism';

    const welcomeText = (rawConfig.welcomeText || `Bienvenue chez ${payload.clientName || 'nous'}`).slice(0, 140);
    const buttonText = (rawConfig.buttonText || 'Se connecter').slice(0, 50);
    const termsOfUse = (rawConfig.termsOfUse || `En vous connectant au réseau Wi-Fi de ${payload.clientName || 'l\'établissement'}, vous acceptez nos conditions d'utilisation RGPD.`).slice(0, 300);
    const promoText = (rawConfig.promoText || '').slice(0, 120);

    const variantFallbackImg = sectorImages[idx % sectorImages.length];
    let backgroundImageUrl = typeof rawConfig.backgroundImageUrl === 'string' && rawConfig.backgroundImageUrl.startsWith('http') ? rawConfig.backgroundImageUrl.slice(0, 300) : variantFallbackImg;

    const fullText = `${payload.sector || ''} ${payload.clientName || ''} ${payload.description || ''}`.toLowerCase();
    if (backgroundImageUrl.includes('photo-1566073771259-6a8506099945') && !fullText.includes('hotel') && !fullText.includes('hôtel') && !fullText.includes('resort')) {
      backgroundImageUrl = variantFallbackImg;
    }

    const promoBannerUrl = typeof rawConfig.promoBannerUrl === 'string' ? rawConfig.promoBannerUrl.slice(0, 300) : '';

    // Sanitized Config - STRICTLY ISOLATES System & Metadata fields (_id, clientId, version, createdAt)
    const config = {
      primaryColor,
      backgroundColor,
      textColor,
      welcomeText,
      buttonText,
      termsOfUse,
      authType,
      templateName,
      backgroundImageUrl,
      promoBannerUrl,
      promoText,
    };

    const explanation = {
      design: typeof rawExplanation.design === 'string' ? rawExplanation.design.slice(0, 250) : 'Palette de couleurs et esthétique visuelle équilibrée.',
      authentication: typeof rawExplanation.authentication === 'string' ? rawExplanation.authentication.slice(0, 250) : `Mode d'authentification ${authType} sélectionné pour répondre à vos objectifs.`,
      marketing: typeof rawExplanation.marketing === 'string' ? rawExplanation.marketing.slice(0, 250) : 'Mise en avant stratégique des offres et services de votre établissement.',
    };

    return {
      name,
      description,
      config,
      explanation,
    };
  });

  return validatedVariants;
}

async function geminiGenerate3Variants(payload = {}) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.85, topP: 0.9 }
  });

  const {
    clientName = 'Hôtel Marina Hammamet',
    sector = 'Hôtel',
    style = 'Premium, élégant et méditerranéen',
    goal = 'Collecter les emails des visiteurs et promouvoir le spa',
    description = ''
  } = payload;

  const timestampSeed = Date.now();

  const prompt = `Tu es un Directeur Artistique et Expert UX/Marketing Senior pour portails captifs Wi-Fi.

BRIEF CLIENT STRICT À RESPECTER IMPÉRATIVEMENT (Session #${timestampSeed}) :
- Nom de l'établissement : "${clientName}"
- Secteur d'activité : "${sector}"
- STYLE VISUEL EXIGÉ PAR LE CLIENT : "${style}"
- OBJECTIF MÉTIER PRINCIPAL : "${goal}"
- DESCRIPTION ET OFFRES SPÉCIFIQUES DU CLIENT : "${description || 'Aucune description spécifique'}"

DIRECTIVES STRICTES DE CONFORMITÉ AU BRIEF :
1. LE STYLE VISUEL EXIGÉ ("${style}") EST TA CONTEXTUALISATION MAÎTRESSE :
   Toutes les 3 variantes doivent s'inspirer DIRECTEMENT des couleurs, ambiances et visuels exigés dans "${style}" :
   - Si le client demande du vert / nature / émeraude -> utilise exclusivement des teintes de vert, émeraude, bois ou crème.
   - Si le client demande du rose / pastel -> utilise du rose poudré, fuchsia, blanc et teintes douces.
   - Si le client demande du bleu / mer / méditerranée -> utilise du bleu nuit, turquoise, sable et blanc.
   - Si le client demande du sombre / doré / luxe -> utilise du noir, bleu nuit, doré et blanc.
   NE GÉNÈRE JAMAIS des couleurs qui contredisent la demande de style "${style}" !

2. L'OBJECTIF MÉTIER ("${goal}") détermine le mode d'authentification (authType).
   - Si l'objectif mentionne email / prospect -> authType="email"
   - Si l'objectif mentionne SMS / téléphone -> authType="phone"
   - Si l'objectif mentionne 1-clic / rapide -> authType="button"

3. LA DESCRIPTION ET LES OFFRES ("${description}") doivent être incorporées dans les textes :
   - welcomeText : formule d'accueil en français valorisant l'établissement et réutilisant les éléments de la description.
   - promoText : promotion/offre spécifique issue ou déduite de la description.
   - buttonText : incite à l'action en lien avec les services décrits dans la description.
   - explanation.marketing : explique spécifiquement comment "${style}" et "${description}" ont été interprétés.

RÈGLES DE DIFFÉRENCIATION DES 3 PROPOSITIONS (TOUTES FIDÈLES AU BRIEF) :
- Variante 1 : Interprétation "Prestige & Sombre" du style "${style}".
- Variante 2 : Interprétation "Lumineuse & Chaleureuse" du style "${style}".
- Variante 3 : Interprétation "Épurée & Minimaliste" du style "${style}".

Toutes les couleurs doivent être des hexadécimaux valides (#RRGGBB).
authType doit appartenir UNIQUEMENT à : "button", "email", "phone", "login", "voucher".
templateName doit appartenir UNIQUEMENT à : "glassmorphism", "modern", "minimalist", "classic".

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks, sans texte explicatif) au format exact suivant:
{
  "variants": [
    {
      "name": "Nom du concept 1",
      "description": "Courte description du concept",
      "config": {
        "primaryColor": "#D6B47C",
        "backgroundColor": "#07182A",
        "textColor": "#FFFFFF",
        "welcomeText": "Bienvenue à l’Hôtel Marina Hammamet",
        "buttonText": "Accéder au Wi-Fi",
        "termsOfUse": "En vous connectant, vous acceptez les conditions d’utilisation du réseau Wi-Fi.",
        "authType": "email",
        "templateName": "glassmorphism",
        "backgroundImageUrl": "URL Unsplash HD valide",
        "promoBannerUrl": "URL Unsplash HD ou vide",
        "promoText": "Profitez de -20 % sur votre première expérience au Marina Spa."
      },
      "explanation": {
        "design": "Explication du choix des couleurs et de la direction visuelle.",
        "authentication": "Explication du mode d'authentification retenu.",
        "marketing": "Explication de la stratégie marketing et promotionnelle."
      }
    },
    {
      "name": "Nom du concept 2",
      "description": "Courte description du concept",
      "config": {
        "primaryColor": "#2A9D8F",
        "backgroundColor": "#F5EFE6",
        "textColor": "#16324F",
        "welcomeText": "Bienvenue au bord de la Méditerranée",
        "buttonText": "Se connecter",
        "termsOfUse": "En vous connectant, vous acceptez les conditions d’utilisation du réseau Wi-Fi.",
        "authType": "email",
        "templateName": "minimalist",
        "backgroundImageUrl": "URL Unsplash HD valide",
        "promoBannerUrl": "",
        "promoText": "Découvrez notre Spa & Wellness."
      },
      "explanation": {
        "design": "Explication du choix des couleurs.",
        "authentication": "Explication du mode d'authentification.",
        "marketing": "Explication de la stratégie marketing."
      }
    },
    {
      "name": "Nom du concept 3",
      "description": "Courte description du concept",
      "config": {
        "primaryColor": "#1E3A5F",
        "backgroundColor": "#FFFFFF",
        "textColor": "#1F2937",
        "welcomeText": "Connectez-vous au Wi-Fi de l’Hôtel Marina",
        "buttonText": "Continuer",
        "termsOfUse": "En vous connectant, vous acceptez les conditions d’utilisation du réseau Wi-Fi.",
        "authType": "email",
        "templateName": "minimalist",
        "backgroundImageUrl": "URL Unsplash HD valide",
        "promoBannerUrl": "",
        "promoText": "Offre Spa exclusive pour nos visiteurs."
      },
      "explanation": {
        "design": "Explication du design minimaliste.",
        "authentication": "Explication de l'authentification.",
        "marketing": "Explication marketing."
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');

  const parsed = JSON.parse(jsonMatch[0]);
  return validateVariantsResponse(parsed, payload);
}

function parseUserStyleToColors(styleText = '', descriptionText = '') {
  const text = (styleText + ' ' + descriptionText).toLowerCase();
  
  if (text.includes('rose') || text.includes('pink') || text.includes('pastel')) {
    return {
      v1: { primary: '#ec4899', bg: '#1f0714', text: '#fce7f3', template: 'glassmorphism' },
      v2: { primary: '#db2777', bg: '#fdf2f8', text: '#831843', template: 'modern' },
      v3: { primary: '#be185d', bg: '#ffffff', text: '#1f2937', template: 'minimalist' },
    };
  }
  if (text.includes('vert') || text.includes('green') || text.includes('nature') || text.includes('émeraude') || text.includes('emeraude') || text.includes('eco') || text.includes('éco')) {
    return {
      v1: { primary: '#059669', bg: '#064e3b', text: '#ecfdf5', template: 'glassmorphism' },
      v2: { primary: '#10b981', bg: '#f0fdf4', text: '#065f46', template: 'modern' },
      v3: { primary: '#047857', bg: '#ffffff', text: '#111827', template: 'minimalist' },
    };
  }
  if (text.includes('bleu') || text.includes('blue') || text.includes('mer') || text.includes('méditerranée') || text.includes('mediterranee') || text.includes('ocean')) {
    return {
      v1: { primary: '#3b82f6', bg: '#0b192c', text: '#eff6ff', template: 'glassmorphism' },
      v2: { primary: '#06b6d4', bg: '#f0fdfa', text: '#164e63', template: 'modern' },
      v3: { primary: '#1d4ed8', bg: '#ffffff', text: '#1e293b', template: 'minimalist' },
    };
  }
  if (text.includes('rouge') || text.includes('red') || text.includes('vif') || text.includes('feu')) {
    return {
      v1: { primary: '#ef4444', bg: '#1a0505', text: '#fef2f2', template: 'modern' },
      v2: { primary: '#f97316', bg: '#fff7ed', text: '#7c2d12', template: 'glassmorphism' },
      v3: { primary: '#dc2626', bg: '#ffffff', text: '#111827', template: 'minimalist' },
    };
  }
  if (text.includes('or') || text.includes('doré') || text.includes('dore') || text.includes('gold') || text.includes('luxe') || text.includes('premium')) {
    return {
      v1: { primary: '#d6b47c', bg: '#07182a', text: '#ffffff', template: 'glassmorphism' },
      v2: { primary: '#b45309', bg: '#fef3c7', text: '#78350f', template: 'modern' },
      v3: { primary: '#d97706', bg: '#ffffff', text: '#1f2937', template: 'minimalist' },
    };
  }

  return {
    v1: { primary: '#8b5cf6', bg: '#0f172a', text: '#f8fafc', template: 'glassmorphism' },
    v2: { primary: '#2a9d8f', bg: '#f5efe6', text: '#16324f', template: 'modern' },
    v3: { primary: '#1e3a5f', bg: '#ffffff', text: '#1f2937', template: 'minimalist' },
  };
}

function localGenerate3Variants(payload = {}) {
  const { clientName = 'Établissement', sector = 'Hôtel', goal = '', style = '', description = '' } = payload;
  const goalLower = (goal || '').toLowerCase();

  let authType = 'email';
  if (goalLower.includes('sms') || goalLower.includes('téléphone') || goalLower.includes('phone')) {
    authType = 'phone';
  } else if (goalLower.includes('un-clic') || goalLower.includes('rapide') || goalLower.includes('bouton')) {
    authType = 'button';
  }

  let customPromo = 'Offre exclusive réservée aux utilisateurs de notre réseau Wi-Fi.';
  if (description && description.length > 5) {
    customPromo = description.slice(0, 110);
  }

  const palette = parseUserStyleToColors(style, description);
  const sectorImages = resolveUnsplashImagesForVariants(sector, clientName, description);

  const v1 = {
    name: `${sector || 'Boutique'} ${style ? style.split(',')[0] : 'Prestige & Sombre'}`,
    description: `Concept fidèle à votre style "${style || 'Premium'}". ${description ? description.slice(0, 80) : ''}`,
    config: {
      primaryColor: palette.v1.primary,
      backgroundColor: palette.v1.bg,
      textColor: palette.v1.text,
      welcomeText: `Bienvenue chez ${clientName}. ${description ? description.slice(0, 80) : 'Profitez de notre réseau Wi-Fi haute vitesse.'}`,
      buttonText: 'Accéder au Wi-Fi',
      termsOfUse: `En vous connectant au réseau Wi-Fi de ${clientName}, vous acceptez nos conditions d'utilisation RGPD.`,
      authType,
      templateName: palette.v1.template,
      backgroundImageUrl: sectorImages[0],
      promoBannerUrl: '',
      promoText: customPromo,
    },
    explanation: {
      design: `Décliné selon votre demande de style : "${style || 'Luxe & Sombre'}".`,
      authentication: `Mode ${authType} sélectionné pour l'objectif : "${goal || 'collecte'}".`,
      marketing: `Intègre les caractéristiques de votre établissement : "${description || clientName}".`
    }
  };

  const v2 = {
    name: `${sector || 'Boutique'} Lumineux & Warm`,
    description: `Déclinaison claire du style "${style || 'Contemporain'}". ${description ? description.slice(0, 80) : ''}`,
    config: {
      primaryColor: palette.v2.primary,
      backgroundColor: palette.v2.bg,
      textColor: palette.v2.text,
      welcomeText: `Bienvenue chez ${clientName}. ${description ? description.slice(0, 80) : 'Installez-vous confortablement.'}`,
      buttonText: 'Se Connecter',
      termsOfUse: `En vous connectant au réseau Wi-Fi de ${clientName}, vous acceptez nos conditions d'utilisation RGPD.`,
      authType,
      templateName: palette.v2.template,
      backgroundImageUrl: sectorImages[1],
      promoBannerUrl: '',
      promoText: customPromo,
    },
    explanation: {
      design: `Version lumineuse et chaleureuse adaptée à votre brief "${style || 'Moderne'}".`,
      authentication: `Authentification par ${authType} pour servir l'objectif métier.`,
      marketing: `Mise en valeur directe des services décrits : "${description || sector}".`
    }
  };

  const v3 = {
    name: `${sector} Épuré & Minimal`,
    description: `Version ultra-épurée axée sur la lisibilité et la clarté d'accès Wi-Fi.`,
    config: {
      primaryColor: palette.v3.primary,
      backgroundColor: palette.v3.bg,
      textColor: palette.v3.text,
      welcomeText: `Accès Wi-Fi ${clientName}`,
      buttonText: 'Continuer vers Internet',
      termsOfUse: `En vous connectant au réseau Wi-Fi de ${clientName}, vous acceptez nos conditions d'utilisation RGPD.`,
      authType,
      templateName: palette.v3.template,
      backgroundImageUrl: sectorImages[2],
      promoBannerUrl: '',
      promoText: customPromo,
    },
    explanation: {
      design: `Design minimaliste et sobre dérivé de vos préférences visuelles.`,
      authentication: `Mode d'authentification ${authType} fluide et rapide.`,
      marketing: `Communication synthétique centrée sur vos arguments clés.`
    }
  };

  return [v1, v2, v3];
}

export async function generate3Variants(payload = {}) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiGenerate3Variants(payload);
    } catch (err) {
      console.warn('Gemini API error in generate3Variants, falling back to local variants:', err.message);
    }
  }
  return localGenerate3Variants(payload);
}

/**
 * Routeur Central d'Actions IA (Dispatcher)
 */
export async function handleAiAction(action, payload = {}) {
  switch (action) {
    case 'modify': {
      const { instructions, currentConfig, analyticsSummary } = payload;
      if (!instructions) throw new Error('Les instructions sont requises pour l\'action "modify".');
      return await modifyPortal(instructions, currentConfig || {}, analyticsSummary || '');
    }

    case 'generate': {
      const { sector, clientName, businessGoalPrompt, prompt } = payload;
      return await generatePortal(sector || 'default', clientName || 'Client', businessGoalPrompt || prompt || '');
    }

    case 'optimize': {
      const { currentConfig, analyticsData } = payload;
      if (!currentConfig) throw new Error('La configuration actuelle est requise pour l\'action "optimize".');
      return await optimizePortal(currentConfig, analyticsData || {});
    }

    case 'recommend': {
      const { currentConfig } = payload;
      if (!currentConfig) throw new Error('La configuration actuelle est requise pour l\'action "recommend".');
      return { 
        suggestions: recommendPortalImprovements(currentConfig), 
        method: 'local-analysis' 
      };
    }

    case 'generate3Variants': {
      return {
        variants: await generate3Variants(payload),
        method: process.env.GEMINI_API_KEY ? 'gemini-copilot' : 'local-copilot'
      };
    }

    default:
      throw new Error(`Action IA inconnue: "${action}". Actions autorisées: "modify", "generate", "optimize", "recommend".`);
  }
}
