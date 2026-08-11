'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Wifi, Activity, BarChart2, 
  ArrowRight, Shield, Calendar, RefreshCw, Cpu
} from 'lucide-react';

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-slate-400">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass border-red-500/20 p-6 rounded-xl text-center max-w-md mx-auto">
        <p className="text-red-400 font-semibold mb-2">Erreur de chargement</p>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn-secondary text-xs">Réessayer</button>
      </div>
    );
  }

  // Fallback default stats if none found
  const {
    totalClients = 0,
    activePortals = 0,
    totalConnections = 0,
    connectionsPerDay = [],
    recentActivity = [],
    authTypes = {},
    portalStats = []
  } = stats || {};

  // Custom high-quality SVG calculation for history chart
  const maxVal = Math.max(...connectionsPerDay.map(d => d.connections), 10);
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  const points = connectionsPerDay.map((d, i) => {
    const x = padding + (i * (chartWidth - padding * 2) / (connectionsPerDay.length - 1 || 1));
    const y = chartHeight - padding - (d.connections * (chartHeight - padding * 2) / maxVal);
    return { x, y, ...d };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Header section with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Vue d'ensemble</h2>
          <p className="text-xs text-slate-400">Suivi en direct des performances de votre parc de portails captifs.</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary py-2 px-3 text-xs flex items-center gap-2">
          <RefreshCw size={12} />
          Rafraîchir
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="kpi-card glass">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Clients</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalClients}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Users size={20} />
            </div>
          </div>
          <Link href="/dashboard/clients" className="text-xs text-purple-400 flex items-center gap-1 hover:underline">
            Gérer les clients <ArrowRight size={12} />
          </Link>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card glass">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Portails Actifs</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{activePortals}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Wifi size={20} />
            </div>
          </div>
          <Link href="/dashboard/portals" className="text-xs text-emerald-400 flex items-center gap-1 hover:underline">
            Voir la liste <ArrowRight size={12} />
          </Link>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card glass">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connexions Réseau</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalConnections}</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
              <Activity size={20} />
            </div>
          </div>
          <span className="badge badge-info text-[0.65rem] py-0 px-2">Simulation Live</span>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card glass">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moteur d'IA</p>
              <h3 className="text-base font-bold text-slate-100 mt-2">Gemini 1.5 Flash</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Cpu size={20} />
            </div>
          </div>
          <span className="badge badge-purple text-[0.65rem] py-0 px-2">Hybride / NLP Fallback</span>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Connections Chart (SVG) */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 size={16} className="text-purple-400" />
              Historique des connexions (7 derniers jours)
            </h3>
            <span className="text-[0.7rem] text-slate-400 font-medium">Connexions par jour</span>
          </div>

          <div className="relative w-full h-[180px] flex items-center justify-center">
            {totalConnections === 0 ? (
              <div className="text-center p-6">
                <p className="text-xs text-slate-500">Aucune donnée de connexion enregistrée.</p>
                <p className="text-[0.7rem] text-slate-600 mt-1">Créez un client et simulez des connexions sur son portail captif pour voir ce graphique s'animer.</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                  const y = padding + r * (chartHeight - padding * 2);
                  return (
                    <line 
                      key={idx} 
                      x1={padding} 
                      y1={y} 
                      x2={chartWidth - padding} 
                      y2={y} 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth={1} 
                    />
                  );
                })}

                {/* Connection line */}
                <polyline
                  fill="none"
                  stroke="url(#chart-grad)"
                  strokeWidth="3"
                  points={polylinePoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Connection dots */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="var(--bg-primary)"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                    />
                    {/* Tooltip value */}
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fontSize="9"
                      fill="#a78bfa"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {p.connections}
                    </text>
                    {/* Day label */}
                    <text
                      x={p.x}
                      y={chartHeight - 8}
                      fontSize="8"
                      fill="#94a3b8"
                      textAnchor="middle"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>

        {/* Right: Auth Type Breakdown & Hotspots */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Shield size={16} className="text-indigo-400" />
            Méthodes d'authentification
          </h3>

          <div className="space-y-3 pt-2">
            {Object.keys(authTypes).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Aucune statistique disponible.</p>
            ) : (
              Object.entries(authTypes).map(([type, count]) => {
                const percentage = Math.round((count / (totalConnections || 1)) * 100);
                const displayNames = {
                  button: 'Bouton simple',
                  email: 'Adresse Email',
                  phone: 'Numéro Téléphone',
                  login: 'Login / MDP',
                  voucher: 'Code Voucher'
                };
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{displayNames[type] || type}</span>
                      <span className="text-slate-400 font-semibold">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs & Top Portals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Portals Hotspots */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Portails les plus fréquentés
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom du Portail</th>
                  <th>Client</th>
                  <th className="text-right">Connexions</th>
                </tr>
              </thead>
              <tbody>
                {portalStats.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-xs text-slate-500">Aucun portail trouvé.</td>
                  </tr>
                ) : (
                  portalStats.slice(0, 5).map((p, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-slate-200">{p.portalName}</td>
                      <td>
                        <span className="badge badge-purple">{p.clientName}</span>
                      </td>
                      <td className="text-right font-bold text-slate-300">{p.connections}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Modification History */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" />
            Dernières modifications
          </h3>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Aucune modification récente.</p>
            ) : (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="flex gap-3 text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 self-start mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-200 font-medium">{activity.description}</p>
                    <p className="text-[0.7rem] text-slate-400">
                      Par <span className="text-purple-400 font-semibold">{activity.modifiedBy}</span> • {new Date(activity.modifiedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
