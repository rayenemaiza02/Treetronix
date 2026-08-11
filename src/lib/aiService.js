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

function localGenerate(sector, clientName) {
  const sectorKey = (sector || '').toLowerCase().replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e');
  const template = SECTOR_TEMPLATES[sectorKey] || SECTOR_TEMPLATES['default'];
  return {
    config: {
      ...template,
      name: `Portail ${clientName || 'Client'}`,
      welcomeText: template.welcomeText,
    },
    explanation: `Template généré automatiquement pour le secteur "${sector || 'Général'}" (moteur local).`,
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

async function geminiModify(instructions, currentConfig) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Tu es un assistant de personnalisation de portails captifs Wi-Fi. 
L'utilisateur demande: "${instructions}"

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

async function geminiGenerate(sector, clientName) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Tu es un expert en design de portails captifs Wi-Fi. 
Génère un template complet pour un client dans le secteur "${sector}" nommé "${clientName}".

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec ces champs:
{
  "name": "nom du portail",
  "primaryColor": "couleur hex principale",
  "backgroundColor": "couleur hex de fond (sombre)",
  "textColor": "couleur hex du texte",
  "welcomeText": "texte d'accueil en français (max 100 chars)",
  "buttonText": "texte du bouton en français",
  "authType": "button | email | phone | login | voucher",
  "templateName": "glassmorphism | modern | minimalist | classic",
  "backgroundImageUrl": "URL de l'image de fond (unsplash de préférence)",
  "termsOfUse": "courtes conditions d'utilisation en français"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');
  
  const config = JSON.parse(jsonMatch[0]);
  return {
    config,
    explanation: `Template généré par Gemini AI pour le secteur "${sector}".`,
    method: 'gemini'
  };
}

// ---- Public API ----

export async function modifyPortal(instructions, currentConfig) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiModify(instructions, currentConfig);
    } catch (err) {
      console.warn('Gemini API error, falling back to local parser:', err.message);
    }
  }
  return localModify(instructions, currentConfig);
}

export async function generatePortal(sector, clientName) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiGenerate(sector, clientName);
    } catch (err) {
      console.warn('Gemini API error, falling back to local generator:', err.message);
    }
  }
  return localGenerate(sector, clientName);
}

export function recommendPortalImprovements(config) {
  return localRecommend(config);
}
