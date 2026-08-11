/**
 * db.js — Sélecteur de base de données hybride
 *
 * Priorité :
 *  1. Supabase  → si NEXT_PUBLIC_SUPABASE_URL est défini
 *  2. MongoDB   → si MONGODB_URI est défini
 *  3. JSON local → fallback automatique (data/local_db.json)
 */

import { jsonDb } from './jsonDb';

const USE_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const USE_MONGO    = !!process.env.MONGODB_URI;

// ── MongoDB (conservé pour compatibilité) ────────────────────────────────────
let cachedMongoModels = null;

async function getMongoModels() {
  if (cachedMongoModels) return cachedMongoModels;

  const { default: mg } = await import('mongoose');
  if (mg.connection.readyState === 0) {
    await mg.connect(process.env.MONGODB_URI, { bufferCommands: false });
  }

  const ClientSchema = new mg.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sector: { type: String, default: 'other' },
    email: { type: String, default: '' },
    password: { type: String, default: 'client123' },
    createdAt: { type: Date, default: Date.now },
  });

  const PortalSchema = new mg.Schema({
    clientId: { type: mg.Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#8b5cf6' },
    backgroundColor: { type: String, default: '#0f172a' },
    textColor: { type: String, default: '#f8fafc' },
    backgroundImageUrl: { type: String, default: '' },
    welcomeText: { type: String, default: 'Bienvenue sur notre réseau Wi-Fi' },
    buttonText: { type: String, default: 'Se connecter' },
    termsOfUse: { type: String, default: "En vous connectant, vous acceptez les conditions d'utilisation." },
    promoBannerUrl: { type: String, default: '' },
    authType: { type: String, default: 'button' },
    templateName: { type: String, default: 'glassmorphism' },
    version: { type: Number, default: 1 },
    updatedAt: { type: Date, default: Date.now },
  });

  const PortalHistorySchema = new mg.Schema({
    portalId: { type: mg.Schema.Types.ObjectId, ref: 'Portal', required: true },
    version: Number,
    config: mg.Schema.Types.Mixed,
    modifiedBy: { type: String, default: 'Admin' },
    modifiedAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  });

  const ConnectionStatSchema = new mg.Schema({
    portalId: { type: mg.Schema.Types.ObjectId, ref: 'Portal', required: true },
    authTypeUsed: String,
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: 'success' },
  });

  cachedMongoModels = {
    clients:         mg.models.Client         || mg.model('Client',         ClientSchema),
    portals:         mg.models.Portal         || mg.model('Portal',         PortalSchema),
    portalhistories: mg.models.PortalHistory  || mg.model('PortalHistory',  PortalHistorySchema),
    connectionstats: mg.models.ConnectionStat || mg.model('ConnectionStat', ConnectionStatSchema),
  };

  return cachedMongoModels;
}

// ── Sélecteur principal ──────────────────────────────────────────────────────
export async function getDb() {
  if (USE_SUPABASE) {
    console.log('[DB] ✅ Utilisation de Supabase (PostgreSQL)');
    const { supabaseDb } = await import('./supabaseDb');
    return supabaseDb;
  }

  if (USE_MONGO) {
    console.log('[DB] ✅ Utilisation de MongoDB');
    return await getMongoModels();
  }

  console.log('[DB] ⚠️  Utilisation du JSON local (data/local_db.json)');
  return jsonDb;
}
