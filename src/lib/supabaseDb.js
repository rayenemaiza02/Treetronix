/**
 * supabaseDb.js
 * Adaptateur Supabase qui expose la même interface que jsonDb.js
 * Conversion automatique camelCase <-> snake_case pour compatibilité avec le reste du code.
 */

import { supabase } from './supabaseClient';

// ── Mapping des noms de champs camelCase → snake_case ────────────────────────
const TO_SNAKE = {
  _id:              'id',
  clientId:         'client_id',
  portalId:         'portal_id',
  isActive:         'is_active',
  logoUrl:          'logo_url',
  backgroundImageUrl: 'background_image_url',
  primaryColor:     'primary_color',
  backgroundColor:  'background_color',
  textColor:        'text_color',
  welcomeText:      'welcome_text',
  buttonText:       'button_text',
  termsOfUse:       'terms_of_use',
  promoBannerUrl:   'promo_banner_url',
  authType:         'auth_type',
  templateName:     'template_name',
  updatedAt:        'updated_at',
  createdAt:        'created_at',
  modifiedBy:       'modified_by',
  modifiedAt:       'modified_at',
  authTypeUsed:     'auth_type_used',
};

// Inverse automatique snake_case → camelCase
const TO_CAMEL = Object.fromEntries(
  Object.entries(TO_SNAKE).map(([camel, snake]) => [snake, camel])
);

// ── Fonctions de conversion ──────────────────────────────────────────────────

function toSnakeCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = TO_SNAKE[key] || key;
    result[snakeKey] = value;
  }
  return result;
}

function toCamelCase(row) {
  if (!row) return null;
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = TO_CAMEL[key] || key;
    result[camelKey] = value;
  }
  // Toujours exposer _id pour la compatibilité avec le code existant
  if (!result._id && row.id) result._id = row.id;
  return result;
}

// Applique les filtres de query à une requête Supabase
function applyQuery(supabaseQuery, query = {}) {
  for (const [key, value] of Object.entries(query)) {
    const snakeKey = TO_SNAKE[key] || key;
    supabaseQuery = supabaseQuery.eq(snakeKey, value);
  }
  return supabaseQuery;
}

// ── Fabrique de collection générique ────────────────────────────────────────

function makeCollection(tableName, options = {}) {
  return {

    // Récupérer plusieurs enregistrements
    find: async (query = {}) => {
      let q = supabase.from(tableName).select('*');
      q = applyQuery(q, query);
      if (options.orderBy) {
        q = q.order(options.orderBy, { ascending: options.ascending ?? false });
      }
      const { data, error } = await q;
      if (error) throw new Error(`[Supabase ${tableName}] find: ${error.message}`);
      return (data || []).map(toCamelCase);
    },

    // Récupérer un seul enregistrement
    findOne: async (query = {}) => {
      let q = supabase.from(tableName).select('*');
      q = applyQuery(q, query);
      const { data, error } = await q;
      if (error) throw new Error(`[Supabase ${tableName}] findOne: ${error.message}`);
      return data && data.length > 0 ? toCamelCase(data[0]) : null;
    },

    // Récupérer par ID
    findById: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id);
      if (error) throw new Error(`[Supabase ${tableName}] findById: ${error.message}`);
      return data && data.length > 0 ? toCamelCase(data[0]) : null;
    },

    // Créer un enregistrement
    create: async (doc) => {
      const snakeDoc = toSnakeCase(doc);
      delete snakeDoc.id; // Laisser Supabase générer l'UUID
      const { data, error } = await supabase
        .from(tableName)
        .insert(snakeDoc)
        .select();
      if (error) throw new Error(`[Supabase ${tableName}] create: ${error.message}`);
      return toCamelCase(data[0]);
    },

    // Mettre à jour par ID
    findByIdAndUpdate: async (id, update) => {
      const snakeUpdate = toSnakeCase(update);
      delete snakeUpdate.id;
      const { data, error } = await supabase
        .from(tableName)
        .update(snakeUpdate)
        .eq('id', id)
        .select();
      if (error) throw new Error(`[Supabase ${tableName}] findByIdAndUpdate: ${error.message}`);
      return data && data.length > 0 ? toCamelCase(data[0]) : null;
    },

    // Mettre à jour par query
    updateOne: async (query, update) => {
      let q = supabase.from(tableName).update(toSnakeCase(update));
      q = applyQuery(q, query);
      const { error } = await q;
      if (error) throw new Error(`[Supabase ${tableName}] updateOne: ${error.message}`);
      return { modifiedCount: 1 };
    },

    // Supprimer un enregistrement
    deleteOne: async (query) => {
      let q = supabase.from(tableName).delete();
      q = applyQuery(q, query);
      const { error } = await q;
      if (error) throw new Error(`[Supabase ${tableName}] deleteOne: ${error.message}`);
      return { deletedCount: 1 };
    },

    // Supprimer plusieurs enregistrements
    deleteMany: async (query) => {
      let q = supabase.from(tableName).delete();
      q = applyQuery(q, query);
      const { error } = await q;
      if (error) throw new Error(`[Supabase ${tableName}] deleteMany: ${error.message}`);
      return { deletedCount: 1 };
    },
  };
}

// ── Export de l'adaptateur complet ──────────────────────────────────────────

export const supabaseDb = {
  clients:         makeCollection('clients',          { orderBy: 'created_at', ascending: false }),
  portals:         makeCollection('portals',           { orderBy: 'updated_at', ascending: false }),
  portalhistories: makeCollection('portal_histories',  { orderBy: 'modified_at', ascending: false }),
  connectionstats: makeCollection('connection_stats',  { orderBy: 'timestamp',   ascending: false }),
};
