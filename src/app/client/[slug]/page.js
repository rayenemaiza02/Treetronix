'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Sparkles, RefreshCw, Send, CheckCircle, 
  Eye, Undo, Smartphone, AlertTriangle, Zap, BarChart2, Users, Radio, LogOut
} from 'lucide-react';

export default function ClientDashboard({ params }) {
  const slug = params.slug;
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdminMode = searchParams.get('admin') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('treetronix_session');
    router.push('/login');
  };

  const [client, setClient] = useState(null);
  const [portal, setPortal] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Tabs for client space
  const [activeTab, setActiveTab] = useState('ai'); // ai | stats | design | history

  // AI Assistant chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Bonjour ! Bienvenue dans votre espace de personnalisation. Je suis votre assistant IA Treetronix. Demandez-moi des modifications pour votre portail en langage naturel.\nExemples :\n• \"Mets un fond sombre et un bouton vert\"\n• \"Change le texte d'accueil pour 'Bienvenue chez nous'\"\n• \"Utilise un template minimaliste et active l'authentification par email\"" }
  ]);
  const [aiWorking, setAiWorking] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Version History state
  const [history, setHistory] = useState([]);

  // Toast
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchClientPortalData = async () => {
    try {
      // 1. Find client by slug (with partial match fallback)
      const clientsRes = await fetch('/api/clients', { cache: 'no-store' });
      const clientsData = await clientsRes.json();
      if (!clientsData.success) throw new Error(clientsData.error);
      
      let foundClient = clientsData.data.find(c => c.slug === slug);
      if (!foundClient) {
        foundClient = clientsData.data.find(c => 
          c.slug.startsWith(slug) || 
          slug.startsWith(c.slug) || 
          c.slug.includes(slug)
        );
      }

      if (!foundClient) {
        throw new Error(`Client "${slug}" introuvable.`);
      }
      setClient(foundClient);

      // 2. Find portal config by client ID
      const portalRes = await fetch(`/api/portals/${foundClient._id}`, { cache: 'no-store' });
      const portalData = await portalRes.json();
      if (portalData.success && portalData.data) {
        setPortal(portalData.data);
        fetchRecommendations(portalData.data);

        // 3. Find client specific history
        const historyRes = await fetch(`/api/portals/${foundClient._id}/history`, { cache: 'no-store' });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data);
        }

        // 4. Fetch client specific stats
        const statsRes = await fetch('/api/stats', { cache: 'no-store' });
        const statsData = await statsRes.json();
        if (statsData.success) {
          // Filter stats for this portal only
          const portalIdStr = String(portalData.data._id);
          const allStats = statsData.data;
          
          const filteredPortalStats = allStats.portalStats.find(p => String(p.portalId) === portalIdStr) || { connections: 0 };
          const connectionsCount = filteredPortalStats.connections;

          // Connections per day for this portal
          const portalConnections = allStats.connectionsPerDay.map(d => {
            // Simulated local distribution per day
            const share = connectionsCount > 0 ? Math.round(d.connections * 0.4) : 0;
            return {
              ...d,
              connections: share
            };
          });

          // Auth distribution (simulated or simplified for this portal)
          const authDistribution = allStats.authTypes;

          setStats({
            connections: connectionsCount,
            connectionsPerDay: portalConnections,
            authTypes: authDistribution
          });
        }
      } else {
        throw new Error("Impossible de charger la configuration de votre portail.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (currentPortal) => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recommend', currentConfig: currentPortal })
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  useEffect(() => {
    fetchClientPortalData();
  }, [slug]);

  useEffect(() => {
    if (activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleManualChange = (field, value) => {
    setPortal(prev => {
      const updated = { ...prev, [field]: value };
      fetchRecommendations(updated);
      return updated;
    });
  };

  const handleSaveConfig = async (e, desc = 'Mise à jour par le Client') => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/portals/${portal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...portal, 
          modifiedBy: client.name,
          description: desc 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Configuration enregistrée et publiée !', 'success');
        // Refresh history
        const historyRes = await fetch(`/api/portals/${client._id}/history`);
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data);
        }
      } else {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAiInstruction = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setAiWorking(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify',
          instructions: userText,
          currentConfig: portal
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const { config, changes, method } = data.data;
        setPortal(config);
        fetchRecommendations(config);
        
        let responseMsg = `J'ai adapté votre portail selon vos consignes (${method === 'gemini' ? 'via Gemini' : 'moteur local'}) :\n` + 
          changes.map(c => `• ${c}`).join('\n') + 
          `\n\nVous pouvez prévisualiser le rendu à droite. N'oubliez pas d'enregistrer pour publier !`;
        
        setChatMessages(prev => [...prev, { role: 'ai', text: responseMsg }]);
        showToast('Modifications appliquées !', 'info');
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Désolé, une erreur est survenue : ${data.error}` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erreur : ${err.message}` }]);
    } finally {
      setAiWorking(false);
    }
  };

  const handleAiAutoGenerate = async () => {
    if (!client) return;
    if (!confirm(`Voulez-vous régénérer automatiquement un portail complet pour votre secteur "${client.sector}" ? Vos modifications non enregistrées seront remplacées.`)) {
      return;
    }

    setAiWorking(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          sector: client.sector,
          clientName: client.name
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPortal(prev => ({
          ...prev,
          ...data.data.config
        }));
        fetchRecommendations(data.data.config);
        showToast('Nouveau template généré par l\'IA !', 'success');
        
        setChatMessages(prev => [...prev, { 
          role: 'ai', 
          text: `J'ai conçu un tout nouveau portail adapté au secteur "${client.sector}".\nExplication : ${data.data.explanation}\nN'oubliez pas d'enregistrer pour mettre en ligne.` 
        }]);
        setActiveTab('ai');
      } else {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAiWorking(false);
    }
  };

  const handleApplySuggestion = (fix) => {
    if (!fix) return;
    setPortal(prev => {
      const updated = { ...prev, ...fix };
      fetchRecommendations(updated);
      return updated;
    });
    showToast('Recommandation appliquée !', 'success');
  };

  const handleRestoreVersion = async (historyItem) => {
    const historyId = typeof historyItem === 'object' ? (historyItem._id || historyItem.id || historyItem.version) : historyItem;
    const versionLabel = typeof historyItem === 'object' ? historyItem.version : historyItem;
    const portalId = portal._id || portal.id;

    if (!confirm(`Restaurer la version ${versionLabel} ? Votre configuration actuelle sera sauvegardée dans l'historique.`)) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/portals/${portalId}/history/${historyId}/restore`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && (data.portal || data.data)) {
        const restoredPortal = data.portal || data.data;
        setPortal(restoredPortal);
        fetchRecommendations(restoredPortal);
        showToast(`Version ${versionLabel} restaurée avec succès !`, 'success');
        
        // Refresh history
        const historyRes = await fetch(`/api/portals/${client._id}/history`);
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data);
        }
      } else {
        showToast(data.error || 'Erreur lors de la restauration.', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060918] gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-slate-400">Chargement de votre Espace Client...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060918] p-6 text-center">
        <div className="glass border-red-500/20 p-6 rounded-2xl max-w-md space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Erreur d'accès</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <Link href="/dashboard" className="text-decoration-none">
            <button className="btn-secondary text-xs mx-auto">Retour au Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  // Get dynamic styles for simulator
  const getTemplateStyle = () => {
    const baseStyle = {};
    if (portal.backgroundImageUrl) {
      baseStyle.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url(${portal.backgroundImageUrl})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
    }

    switch (portal.templateName) {
      case 'modern':
        return {
          background: portal.backgroundImageUrl 
            ? baseStyle.backgroundImage 
            : `linear-gradient(180deg, ${portal.backgroundColor} 0%, #000 100%)`,
          fontFamily: 'system-ui, sans-serif',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'minimalist':
        return {
          background: portal.backgroundImageUrl ? baseStyle.backgroundImage : portal.backgroundColor,
          fontFamily: 'serif',
          border: '1px solid rgba(255,255,255,0.05)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'classic':
        return {
          background: portal.backgroundImageUrl 
            ? baseStyle.backgroundImage 
            : `radial-gradient(circle at center, ${portal.backgroundColor} 60%, #000 100%)`,
          fontFamily: 'Georgia, serif',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'glassmorphism':
      default:
        return {
          background: portal.backgroundImageUrl 
            ? `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url(${portal.backgroundImageUrl})` 
            : `radial-gradient(ellipse at top, ${portal.backgroundColor} 40%, #030712 100%)`,
          backdropFilter: 'blur(10px)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
    }
  };

  // SVG Chart calculation for client connections
  const connectionsPerDay = stats?.connectionsPerDay || [];
  const maxVal = Math.max(...connectionsPerDay.map(d => d.connections), 5);
  const chartHeight = 130;
  const chartWidth = 400;
  const padding = 20;

  const points = connectionsPerDay.map((d, i) => {
    const x = padding + (i * (chartWidth - padding * 2) / (connectionsPerDay.length - 1 || 1));
    const y = chartHeight - padding - (d.connections * (chartHeight - padding * 2) / maxVal);
    return { x, y, ...d };
  });
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div className="animated-bg" />

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <header style={{
        height: 64,
        background: 'rgba(6, 9, 24, 0.8)',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        justifyContent: 'between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="flex items-center gap-3 flex-1">
          {isAdminMode && (
            <Link href="/dashboard/clients">
              <button className="btn-secondary p-2 rounded-lg" title="Retour Administration">
                <ArrowLeft size={16} />
              </button>
            </Link>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)'
          }}>
            <Radio size={16} color="white" />
          </div>
          <div>
            <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider block">Espace Client Personnel</span>
            <span className="text-sm font-extrabold text-white">{client.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={`/portal/${slug}`} target="_blank" rel="noopener noreferrer">
            <button className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
              <Eye size={12} />
              Voir le Portail en Direct
            </button>
          </a>
          <button
            onClick={(e) => handleSaveConfig(e, 'Sauvegarde depuis Espace Client')}
            disabled={saving}
            className="btn-primary text-xs py-2"
          >
            {saving ? 'Publication...' : 'Enregistrer'}
          </button>
          {!isAdminMode && (
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              title="Déconnexion"
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
            >
              <LogOut size={12} />
              Déconnexion
            </button>
          )}
        </div>
      </header>

      {/* Studio Workspace */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Client Studio Control Center (cols 1 to 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dashboard specific metrics for client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="kpi-card glass p-4 flex justify-between items-center">
              <div>
                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Connexions (Ce Mois-ci)</p>
                <h4 className="text-xl font-bold text-slate-200 mt-1">{stats?.connections || 0}</h4>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <Users size={16} />
              </div>
            </div>

            <div className="kpi-card glass p-4 flex justify-between items-center">
              <div>
                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Modèle Actif</p>
                <h4 className="text-xs font-bold text-slate-200 mt-2 capitalize">{portal.templateName}</h4>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                <Zap size={16} />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="glass p-1.5 rounded-xl border border-white/5 flex gap-1">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex justify-center items-center gap-1.5 ${activeTab === 'ai' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles size={12} className="text-purple-300" />
              Assistant IA Générative
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'design' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🎨 Style Manuel
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'stats' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📊 Fréquentation
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🕐 Versions
            </button>
          </div>

          {/* TAB 1: GENERATIVE AI */}
          {activeTab === 'ai' && (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px] fade-in">
              <div className="bg-white/[0.02] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Demande de modification vocale / écrite</span>
                <button 
                  onClick={handleAiAutoGenerate}
                  disabled={aiWorking}
                  className="text-[0.7rem] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-bold"
                >
                  <Sparkles size={12} /> Générer un modèle complet
                </button>
              </div>

              {/* Chat bubbles */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} whitespace-pre-wrap`}
                  >
                    {msg.text}
                  </div>
                ))}
                {aiWorking && (
                  <div className="chat-bubble chat-bubble-ai flex items-center gap-2">
                    <div className="spinner !w-3.5 !h-3.5" />
                    <span>L'IA restructure votre portail...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleAiInstruction} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: 'Mets un style moderne sombre avec boutons jaunes'"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={aiWorking}
                  className="form-input flex-1 bg-white/5"
                />
                <button 
                  type="submit" 
                  disabled={aiWorking || !chatInput.trim()}
                  className="btn-primary px-4 py-2"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MANUAL STYLE */}
          {activeTab === 'design' && (
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-4 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Titre du Portail</label>
                  <input
                    type="text"
                    value={portal.name}
                    onChange={(e) => handleManualChange('name', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Gabarit (Template)</label>
                  <select
                    value={portal.templateName}
                    onChange={(e) => handleManualChange('templateName', e.target.value)}
                    className="form-input bg-[#090e1a]"
                  >
                    <option value="glassmorphism">Glassmorphism (Premium)</option>
                    <option value="modern">Modern (Flat)</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="classic">Classic (Serif)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Boutons / Accents</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={portal.primaryColor}
                      onChange={(e) => handleManualChange('primaryColor', e.target.value)}
                      className="w-10 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <code className="text-xs text-slate-300 font-mono uppercase">{portal.primaryColor}</code>
                  </div>
                </div>

                <div>
                  <label className="form-label">Fond d'écran</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={portal.backgroundColor}
                      onChange={(e) => handleManualChange('backgroundColor', e.target.value)}
                      className="w-10 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <code className="text-xs text-slate-300 font-mono uppercase">{portal.backgroundColor}</code>
                  </div>
                </div>

                <div>
                  <label className="form-label">Texte</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={portal.textColor}
                      onChange={(e) => handleManualChange('textColor', e.target.value)}
                      className="w-10 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <code className="text-xs text-slate-300 font-mono uppercase">{portal.textColor}</code>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Mode d'Authentification</label>
                  <select
                    value={portal.authType}
                    onChange={(e) => handleManualChange('authType', e.target.value)}
                    className="form-input bg-[#090e1a]"
                  >
                    <option value="button">Connexion en un clic</option>
                    <option value="email">Adresse E-mail</option>
                    <option value="phone">Numéro de Téléphone (SMS)</option>
                    <option value="login">Nom d'utilisateur & MDP</option>
                    <option value="voucher">Code Voucher (Ticket)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Libellé du Bouton</label>
                  <input
                    type="text"
                    value={portal.buttonText}
                    onChange={(e) => handleManualChange('buttonText', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Texte d'accueil</label>
                <textarea
                  rows="2"
                  value={portal.welcomeText}
                  onChange={(e) => handleManualChange('welcomeText', e.target.value)}
                  className="form-input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Logo (URL)</label>
                  <input
                    type="text"
                    placeholder="https://ex.com/logo.png"
                    value={portal.logoUrl || ''}
                    onChange={(e) => handleManualChange('logoUrl', e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="form-label">Image de fond (URL)</label>
                  <input
                    type="text"
                    placeholder="https://ex.com/fond.jpg"
                    value={portal.backgroundImageUrl || ''}
                    onChange={(e) => handleManualChange('backgroundImageUrl', e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="form-label">Bannière Promo (URL)</label>
                  <input
                    type="text"
                    placeholder="https://ex.com/promo.jpg"
                    value={portal.promoBannerUrl || ''}
                    onChange={(e) => handleManualChange('promoBannerUrl', e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Conditions d'utilisation (Réglementation RGPD)</label>
                <textarea
                  rows="2"
                  value={portal.termsOfUse}
                  onChange={(e) => handleManualChange('termsOfUse', e.target.value)}
                  className="form-input resize-none text-[0.7rem] text-slate-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-4 fade-in">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Fréquentation de votre réseau</h3>

              <div className="relative w-full h-[150px] flex items-center justify-center bg-black/10 rounded-xl p-4">
                {connectionsPerDay.length === 0 ? (
                  <p className="text-xs text-slate-500">Aucune statistique enregistrée.</p>
                ) : (
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                    {[0, 0.5, 1].map((r, idx) => {
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

                    <polyline
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      points={polylinePoints}
                    />

                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-primary)" stroke="#8b5cf6" strokeWidth="2" />
                        <text x={p.x} y={p.y - 8} fontSize="8" fill="#a78bfa" textAnchor="middle" fontWeight="bold">
                          {p.connections}
                        </text>
                        <text x={p.x} y={chartHeight - 4} fontSize="8" fill="#94a3b8" textAnchor="middle">
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VERSIONS */}
          {activeTab === 'history' && (
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-3 fade-in">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Sauvegardes automatiques</h3>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Aucun historique enregistré.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {history.map((h) => (
                    <div key={h._id || h.version} className="flex justify-between items-center border border-white/5 rounded-xl p-3 bg-white/[0.01]">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-purple-400">Version {h.version}</span>
                          <span className="text-[0.65rem] text-slate-500">Par {h.modifiedBy}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{h.description || 'Modification'}</p>
                        <p className="text-[0.6rem] text-slate-500">{new Date(h.modifiedAt).toLocaleString('fr-FR')}</p>
                      </div>

                      {Number(h.version) === Number(portal.version) ? (
                        <span className="badge badge-purple text-[0.7rem] py-1 px-2.5 flex items-center gap-1">
                          <CheckCircle size={10} />
                          Version actuelle
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleRestoreVersion(h)}
                          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 hover:border-purple-500/50 hover:text-purple-300 transition"
                        >
                          <Undo size={12} />
                          Restaurer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Recommendations */}
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              Recommandations Ergonomiques IA
            </h4>

            {aiSuggestions.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle size={14} /> Votre portail respecte les normes d'accessibilité et le RGPD !
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="border border-white/5 bg-white/[0.01] p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-200">{sug.title}</span>
                        <span className="text-[0.55rem] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase">{sug.type}</span>
                      </div>
                      <p className="text-[0.7rem] text-slate-400 mt-1">{sug.message}</p>
                    </div>
                    {sug.fix && (
                      <button 
                        onClick={() => handleApplySuggestion(sug.fix)}
                        className="btn-secondary text-[0.65rem] py-1 justify-center w-full mt-2 border-purple-500/20 text-purple-300"
                      >
                        Appliquer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Simulator Mobile View (cols 8 to 12) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start sticky top-24">
          <div className="text-center mb-3">
            <span className="badge badge-info text-[0.65rem] uppercase font-bold tracking-wider flex items-center gap-1">
              <Smartphone size={10} />
              Simulateur Mobile Live
            </span>
          </div>

          {/* Smartphone Simulator */}
          <div className="phone-mockup">
            <div className="phone-screen" style={getTemplateStyle()}>
              {/* Virtual phone header */}
              <div className="flex justify-between items-center px-6 pt-11 pb-2 text-[0.65rem] font-bold text-white/50 select-none">
                <span>09:41</span>
                <span>📶 📡 🔋</span>
              </div>

              {/* Captive Portal Layout inside Simulator */}
              <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center justify-between text-center" style={{ color: portal.textColor }}>
                {/* Logo */}
                <div className="w-full flex justify-center py-2">
                  {portal.logoUrl ? (
                    <img src={portal.logoUrl} alt="Logo" className="max-h-12 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ background: portal.primaryColor }} className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Greeting text */}
                <div className="space-y-2 my-2">
                  <h3 className="text-sm font-extrabold">{portal.name || 'Accès Internet'}</h3>
                  <p className="text-[0.7rem] opacity-80 leading-relaxed font-normal">{portal.welcomeText}</p>
                </div>

                {/* Promo Banner */}
                {portal.promoBannerUrl && (
                  <div className="w-full rounded-lg overflow-hidden border border-white/5 my-1">
                    <img src={portal.promoBannerUrl} alt="Promo" className="w-full h-14 object-cover" />
                  </div>
                )}

                {/* Form fields based on Auth Type */}
                <div className="w-full space-y-2.5 my-3">
                  {portal.authType === 'email' && (
                    <input type="email" placeholder="Adresse email" disabled className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-[0.7rem] text-white placeholder-white/35 focus:outline-none" />
                  )}
                  {portal.authType === 'phone' && (
                    <input type="tel" placeholder="Numéro de mobile" disabled className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-[0.7rem] text-white placeholder-white/35 focus:outline-none" />
                  )}
                  {portal.authType === 'login' && (
                    <div className="space-y-1.5">
                      <input type="text" placeholder="Identifiant" disabled className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-[0.7rem] text-white placeholder-white/35 focus:outline-none" />
                      <input type="password" placeholder="Mot de passe" disabled className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-[0.7rem] text-white placeholder-white/35 focus:outline-none" />
                    </div>
                  )}
                  {portal.authType === 'voucher' && (
                    <input type="text" placeholder="Code voucher" disabled className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-[0.7rem] text-white placeholder-white/35 focus:outline-none" />
                  )}

                  {/* Connect Button */}
                  <button style={{ background: portal.primaryColor, boxShadow: `0 4px 12px ${portal.primaryColor}30` }} className="w-full py-2.5 rounded-lg text-[0.7rem] font-bold text-white">
                    {portal.buttonText}
                  </button>
                </div>

                {/* Footer terms */}
                <p className="text-[0.5rem] opacity-50 leading-normal max-h-12 overflow-y-auto px-2">
                  {portal.termsOfUse}
                </p>
              </div>

              {/* Virtual Home Indicator */}
              <div className="flex justify-center items-center py-1.5">
                <div className="w-20 h-0.5 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
