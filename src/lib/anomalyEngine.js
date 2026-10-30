/**
 * anomalyEngine.js
 * Algorithme Déterministe de Détection d'Anomalies
 *
 * Analyse les métriques d'analytics et la configuration du portail pour identifier
 * automatiquement des anomalies réelles (chute de trafic, taux d'échec élevé, inactivité,
 * problèmes de contraste, conformité RGPD).
 *
 * RÈGLE ABSOLUE : L'algorithme JS détecte les anomalies (faits déterministes).
 * Gemini intervient ensuite uniquement pour expliquer le problème en langage naturel.
 */

/**
 * Détecte les anomalies d'un portail sur la base de ses métriques et sa configuration.
 * @param {Object} analyticsData - Métriques issues de analyticsEngine.js
 * @param {Object} config - Configuration actuelle du portail
 * @returns {Array} Liste d'anomalies détectées
 */
export function detectPortalAnomalies(analyticsData = {}, config = {}) {
  const anomalies = [];
  const {
    totalConnections = 0,
    successRate = 100,
    growthRate = 0,
    connectionsPerDay = [],
  } = analyticsData;

  // 1. Détection de Chute Brutale de Fréquentation (> 40% de baisse)
  if (totalConnections >= 10 && growthRate <= -40) {
    anomalies.push({
      id: 'traffic_drop',
      severity: 'critical', // 'critical' | 'warning' | 'info'
      title: 'Chute brutale de fréquentation',
      metric: `${growthRate}%`,
      description: `Le nombre de connexions a chuté de ${Math.abs(growthRate)}% sur les 7 derniers jours.`,
      threshold: 'Baisse > 40%',
      recommendation: 'Vérifiez que le routeur Wi-Fi physique est bien sous tension et que le réseau diffuse correctement.',
    });
  }

  // 2. Détection de Taux d'Échec Anormal (> 20% d'échecs)
  if (totalConnections >= 5 && successRate < 80) {
    const failRate = Math.round((100 - successRate) * 10) / 10;
    anomalies.push({
      id: 'high_failure_rate',
      severity: 'critical',
      title: 'Taux d\'échec de connexion élevé',
      metric: `${failRate}% d'échecs`,
      description: `${failRate}% des utilisateurs n'arrivent pas à valider la page de connexion captive.`,
      threshold: 'Taux d\'échec > 20%',
      recommendation: 'Le mode d\'authentification sélectionné est peut-être trop complexe ou comporte une erreur de configuration.',
    });
  }

  // 3. Détection d'Inactivité Soudaine (0 connexions aujourd'hui malgré un historique d'utilisation)
  const todayStats = connectionsPerDay && connectionsPerDay.length > 0 ? connectionsPerDay[connectionsPerDay.length - 1] : null;
  const total7DayConnections = connectionsPerDay.reduce((acc, curr) => acc + curr.connections, 0);
  const avgDailyTraffic = total7DayConnections / 7;

  if (avgDailyTraffic >= 2 && todayStats && todayStats.connections === 0) {
    anomalies.push({
      id: 'zero_today_traffic',
      severity: 'warning',
      title: 'Aucune connexion aujourd\'hui',
      metric: '0 connexions',
      description: `Aucun utilisateur ne s'est connecté aujourd'hui, alors que la moyenne habituelle est de ${Math.round(avgDailyTraffic)} connexions/jour.`,
      threshold: 'Connexions jour = 0',
      recommendation: 'Vérifiez l\'accès Internet et le bon fonctionnement du portail captif sur place.',
    });
  }

  // 4. Détection Incohérence Visuelle (Couleur de fond identique au bouton)
  const bg = (config.backgroundColor || '').toLowerCase().trim();
  const primary = (config.primaryColor || '').toLowerCase().trim();
  if (bg && primary && bg === primary) {
    anomalies.push({
      id: 'contrast_issue',
      severity: 'warning',
      title: 'Problème de contraste (Bouton invisible)',
      metric: 'Couleurs identiques',
      description: 'La couleur du bouton principal est identique à la couleur de fond du portail.',
      threshold: 'Fond === Bouton',
      recommendation: 'Changez la couleur du bouton pour le rendre lisible et cliquable sur écran mobile.',
    });
  }

  // 5. Détection RGPD (Absence de conditions d'utilisation)
  if (!config.termsOfUse || config.termsOfUse.length < 15) {
    anomalies.push({
      id: 'rgpd_missing_terms',
      severity: 'info',
      title: 'Non-conformité RGPD (Mentions manquantes)',
      metric: 'Conditions absentes',
      description: 'Les conditions d\'utilisation de la connexion Wi-Fi sont absentes ou trop courtes.',
      threshold: 'Texte RGPD < 15 car.',
      recommendation: 'Ajoutez des conditions d\'utilisation explicites pour la conformité légale.',
    });
  }

  return anomalies;
}

/**
 * Formate les anomalies détectées sous forme de faits compréhensibles pour l'IA ou l'affichage.
 * @param {Array} anomalies - Liste d'anomalies issues de detectPortalAnomalies
 * @returns {String} Texte structuré
 */
export function formatAnomaliesForAi(anomalies = []) {
  if (anomalies.length === 0) {
    return 'ANOMALIES DÉTECTÉES PAR L\'ALGORITHME : Aucune anomalie détectée. Le portail fonctionne de manière optimale.';
  }

  const items = anomalies.map(a =>
    `• [${a.severity.toUpperCase()}] ${a.title} (${a.metric}) : ${a.description} -> Recommandation: ${a.recommendation}`
  ).join('\n');

  return `ANOMALIES DÉTECTÉES PAR L'ALGORITHME JS (EXACTES & VÉRIFIÉES) :\n${items}`;
}
