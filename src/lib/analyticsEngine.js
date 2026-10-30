/**
 * analyticsEngine.js
 * Moteur d'Analytics Déterministe
 *
 * Tous les calculs statistiques (connexions, heures de pointe, taux de conversion,
 * répartition des méthodes d'auth, tendances) sont calculés avec exactitude en JavaScript
 * AVANT d'être transmis à l'IA ou au Dashboard.
 *
 * RÈGLE ABSOLUE : Gemini ne calcule jamais les chiffres ; il reçoit le résumé déterministe.
 */

import { detectPortalAnomalies, formatAnomaliesForAi } from './anomalyEngine';

const AUTH_LABELS = {
  button: 'Bouton simple (Un-clic)',
  email: 'Adresse Email',
  phone: 'Téléphone (SMS)',
  login: 'Identifiant / Mot de passe',
  voucher: 'Code Coupon / Voucher',
};

/**
 * Calcule l'intégralité des métriques d'analytics pour une liste de connectionstats.
 * @param {Array} statsList - Liste des objets connectionstat
 * @param {Object} options - Options complémentaires (ex: portal, client)
 * @returns {Object} Objet complet de métriques déterministes
 */
export function calculatePortalAnalytics(statsList = [], options = {}) {
  const totalConnections = statsList.length;

  if (totalConnections === 0) {
    return {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      successRate: 0,
      successRateFormatted: '0%',
      topAuthMethod: null,
      authBreakdown: [],
      peakHour: null,
      peakHourFormatted: 'Aucune donnée',
      peakDay: null,
      peakDayFormatted: 'Aucune donnée',
      growthRate: 0,
      growthRateFormatted: '0%',
      trendStatus: 'neutre',
      connectionsPerDay: getEmptyLast7Days(),
      hourlyDistribution: Array(24).fill(0),
      rawStatsCount: 0,
      formattedSummaryForAi: 'Aucune statistique de connexion enregistrée pour le moment.',
    };
  }

  // 1. Taux de Succès & Échecs
  const successfulConnections = statsList.filter(s => s.status === 'success' || !s.status).length;
  const failedConnections = totalConnections - successfulConnections;
  const successRate = Math.round((successfulConnections / totalConnections) * 1000) / 10; // ex: 98.5

  // 2. Répartition des Méthodes d'Authentification
  const authCounts = {};
  statsList.forEach(s => {
    const method = s.authTypeUsed || 'button';
    authCounts[method] = (authCounts[method] || 0) + 1;
  });

  const authBreakdown = Object.entries(authCounts)
    .map(([type, count]) => ({
      type,
      label: AUTH_LABELS[type] || type,
      count,
      percentage: Math.round((count / totalConnections) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const topAuthMethod = authBreakdown.length > 0 ? authBreakdown[0] : null;

  // 3. Distribution Horaire & Heure de Pointe
  const hourlyDistribution = Array(24).fill(0);
  statsList.forEach(s => {
    if (s.timestamp) {
      const date = new Date(s.timestamp);
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        hourlyDistribution[hour]++;
      }
    }
  });

  let maxHourCount = -1;
  let peakHour = 18; // Default fallback hour
  hourlyDistribution.forEach((count, hour) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      peakHour = hour;
    }
  });

  const peakHourFormatted = `${String(peakHour).padStart(2, '0')}h00 - ${String((peakHour + 1) % 24).padStart(2, '0')}h00 (${maxHourCount > 0 ? maxHourCount : 0} connexions)`;

  // 4. Distribution par Jour de la Semaine & Jour de Pointe
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayCounts = Array(7).fill(0);
  statsList.forEach(s => {
    if (s.timestamp) {
      const date = new Date(s.timestamp);
      if (!isNaN(date.getTime())) {
        dayCounts[date.getDay()]++;
      }
    }
  });

  let maxDayCount = -1;
  let peakDayIdx = 0;
  dayCounts.forEach((count, idx) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      peakDayIdx = idx;
    }
  });

  const peakDayFormatted = `${dayNames[peakDayIdx]} (${maxDayCount > 0 ? maxDayCount : 0} connexions)`;

  // 5. Tendances sur 7 Derniers Jours vs 7 Jours Précédents
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const currentPeriodCount = statsList.filter(s => {
    const d = new Date(s.timestamp);
    return d >= sevenDaysAgo;
  }).length;

  const previousPeriodCount = statsList.filter(s => {
    const d = new Date(s.timestamp);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;

  let growthRate = 0;
  if (previousPeriodCount > 0) {
    growthRate = Math.round(((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 1000) / 10;
  } else if (currentPeriodCount > 0) {
    growthRate = 100;
  }

  const growthRateFormatted = `${growthRate >= 0 ? '+' : ''}${growthRate}%`;
  const trendStatus = growthRate > 5 ? 'en hausse' : growthRate < -5 ? 'en baisse' : 'stable';

  // 6. Historique par Jour (7 Derniers Jours)
  const connectionsPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    const dayStats = statsList.filter(s =>
      s.timestamp && s.timestamp.toString().startsWith(dayStr)
    );
    connectionsPerDay.push({
      date: dayStr,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      connections: dayStats.length,
      successCount: dayStats.filter(s => s.status === 'success' || !s.status).length,
    });
  }

  // 7. Résumé textuel déterministe prêt pour injection dans l'IA
  const formattedSummaryForAi = `
DONNÉES ANALYTICS RÉELLES CALCULÉES (EXACTES & VÉRIFIÉES) :
• Total des connexions : ${totalConnections}
• Connexions réussies : ${successfulConnections} (${successRate}%)
• Connexions échouées : ${failedConnections}
• Heure de pointe : ${peakHourFormatted}
• Jour le plus fréquenté : ${peakDayFormatted}
• Méthode d'authentification principale : ${topAuthMethod ? `${topAuthMethod.label} (${topAuthMethod.percentage}% des utilisateurs)` : 'Aucune'}
• Évolution 7 derniers jours : ${growthRateFormatted} (Tendance ${trendStatus})
`.trim();

  // 8. Détection déterministe d'anomalies (JS Algorithm)
  const anomalies = detectPortalAnomalies({
    totalConnections,
    successfulConnections,
    failedConnections,
    successRate,
    growthRate,
    connectionsPerDay,
    topAuthMethod,
  }, options.portal || options.config || {});

  const formattedAnomaliesForAi = formatAnomaliesForAi(anomalies);

  return {
    totalConnections,
    successfulConnections,
    failedConnections,
    successRate,
    successRateFormatted: `${successRate}%`,
    topAuthMethod,
    authBreakdown,
    peakHour,
    peakHourFormatted,
    peakDay: dayNames[peakDayIdx],
    peakDayFormatted,
    growthRate,
    growthRateFormatted,
    trendStatus,
    connectionsPerDay,
    hourlyDistribution,
    anomalies,
    formattedAnomaliesForAi,
    rawStatsCount: totalConnections,
    formattedSummaryForAi: `${formattedSummaryForAi}\n\n${formattedAnomaliesForAi}`,
  };
}

function getEmptyLast7Days() {
  const now = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    result.push({
      date: dayStr,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      connections: 0,
      successCount: 0,
    });
  }
  return result;
}
