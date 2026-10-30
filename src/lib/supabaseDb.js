/**
 * supabaseDb.js
 * Adaptateur Supabase avec conversion camelCase <-> snake_case 
 * et fallback automatique vers jsonDb.js en cas d'erreur réseau / pause Supabase.
 */

import { supabase } from './supabaseClient';
import { jsonDb } from './jsonDb';

// ── Mapping des noms de champs camelCase → snake_case ────────────────────────
const TO_SNAKE = {
  _id:                'id',
  clientId:           'client_id',
  portalId:           'portal_id',
  isActive:           'is_active',
  logoUrl:            'logo_url',
  backgroundImageUrl: 'background_image_url',
  primaryColor:       'primary_color',
  backgroundColor:    'background_color',
  textColor:          'text_color',
  welcomeText:        'welcome_text',
  buttonText:         'button_text',
  termsOfUse:         'terms_of_use',
  promoBannerUrl:     'promo_banner_url',
  promoText:          'promo_text',
  authType:           'auth_type',
  templateName:       'template_name',
  updatedAt:          'updated_at',
  createdAt:          'created_at',
  modifiedBy:         'modified_by',
  modifiedAt:         'modified_at',
  authTypeUsed:       'auth_type_used',
};

const TO_CAMEL = Object.fromEntries(
  Object.entries(TO_SNAKE).map(([camel, snake]) => [snake, camel])
);

function toSnakeCase(obj) {
  if (!obj) return {};
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
  if (!result._id && row.id) result._id = row.id;
  return result;
}

function applyQuery(supabaseQuery, query = {}) {
  for (const [key, value] of Object.entries(query)) {
    const snakeKey = TO_SNAKE[key] || key;
    supabaseQuery = supabaseQuery.eq(snakeKey, value);
  }
  return supabaseQuery;
}

// Helper pour exécuter Supabase avec fallback automatique vers JSON local si réseau KO
async function safeExecute(tableName, actionName, supabaseFn, jsonFallbackFn) {
  try {
    return await supabaseFn();
  } catch (error) {
    console.warn(`[Supabase ${tableName}] ${actionName} indisponible (${error.message}). Bascule automatique sur la base locale JSON.`);
    if (jsonFallbackFn) {
      return await jsonFallbackFn();
    }
    return null;
  }
}

function makeCollection(tableName, jsonCollection, options = {}) {
  return {
    find: async (query = {}) => {
      return safeExecute(tableName, 'find', async () => {
        let q = supabase.from(tableName).select('*');
        q = applyQuery(q, query);
        if (options.orderBy) {
          q = q.order(options.orderBy, { ascending: options.ascending ?? false });
        }
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return (data || []).map(toCamelCase);
      }, () => jsonCollection.find(query));
    },

    findOne: async (query = {}) => {
      return safeExecute(tableName, 'findOne', async () => {
        let q = supabase.from(tableName).select('*');
        q = applyQuery(q, query);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data && data.length > 0 ? toCamelCase(data[0]) : null;
      }, () => jsonCollection.findOne(query));
    },

    findById: async (id) => {
      return safeExecute(tableName, 'findById', async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id);
        if (error) throw new Error(error.message);
        return data && data.length > 0 ? toCamelCase(data[0]) : null;
      }, () => jsonCollection.findById(id));
    },

    create: async (doc) => {
      return safeExecute(tableName, 'create', async () => {
        const snakeDoc = toSnakeCase(doc);
        delete snakeDoc.id;
        const { data, error } = await supabase
          .from(tableName)
          .insert(snakeDoc)
          .select();
        if (error) throw new Error(error.message);
        return toCamelCase(data[0]);
      }, () => jsonCollection.create(doc));
    },

    findByIdAndUpdate: async (id, update) => {
      return safeExecute(tableName, 'findByIdAndUpdate', async () => {
        const snakeUpdate = toSnakeCase(update);
        delete snakeUpdate.id;
        let { data, error } = await supabase
          .from(tableName)
          .update(snakeUpdate)
          .eq('id', id)
          .select();

        // Fallback retry if column is missing in cloud DB schema (e.g. promo_text)
        if (error && error.message && error.message.includes('column')) {
          delete snakeUpdate.promo_text;
          const retryRes = await supabase
            .from(tableName)
            .update(snakeUpdate)
            .eq('id', id)
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) throw new Error(error.message);
        return data && data.length > 0 ? toCamelCase(data[0]) : null;
      }, () => jsonCollection.findByIdAndUpdate(id, update));
    },

    updateOne: async (query, update) => {
      return safeExecute(tableName, 'updateOne', async () => {
        let q = supabase.from(tableName).update(toSnakeCase(update));
        q = applyQuery(q, query);
        const { error } = await q;
        if (error) throw new Error(error.message);
        return { modifiedCount: 1 };
      }, () => jsonCollection.updateOne ? jsonCollection.updateOne(query, update) : { modifiedCount: 1 });
    },

    deleteOne: async (query) => {
      return safeExecute(tableName, 'deleteOne', async () => {
        let q = supabase.from(tableName).delete();
        q = applyQuery(q, query);
        const { error } = await q;
        if (error) throw new Error(error.message);
        return { deletedCount: 1 };
      }, () => jsonCollection.deleteOne(query));
    },

    deleteMany: async (query) => {
      return safeExecute(tableName, 'deleteMany', async () => {
        let q = supabase.from(tableName).delete();
        q = applyQuery(q, query);
        const { error } = await q;
        if (error) throw new Error(error.message);
        return { deletedCount: 1 };
      }, () => jsonCollection.deleteMany(query));
    },
  };
}

export const supabaseDb = {
  clients:         makeCollection('clients',          jsonDb.clients,         { orderBy: 'created_at', ascending: false }),
  portals:         makeCollection('portals',          jsonDb.portals,         { orderBy: 'updated_at', ascending: false }),
  portalhistories: makeCollection('portal_histories', jsonDb.portalhistories, { orderBy: 'modified_at', ascending: false }),
  connectionstats: makeCollection('connection_stats', jsonDb.connectionstats, { orderBy: 'timestamp',   ascending: false }),
};
