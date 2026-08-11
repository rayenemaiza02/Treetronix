'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Sparkles, RefreshCw, Send, CheckCircle, 
  HelpCircle, Eye, Undo, Trash2, Smartphone, ShieldAlert, Zap, AlertTriangle
} from 'lucide-react';

export default function PortalStudio({ params }) {
  const router = useRouter();
  const clientId = params.id;

  // Configuration state
  const [client, setClient] = useState(null);
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Studio tabs
  const [activeTab, setActiveTab] = useState('design'); // design | ai | history

  // AI assistant state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Bonjour ! Je suis votre assistant Treetronix IA. Comment puis-je vous aider à personnaliser votre portail aujourd'hui ? Ex: 'Je veux un bouton vert et un fond sombre' ou 'Génère un thème moderne pour un café'." }
  ]);
  const [aiWorking, setAiWorking] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // History state
  const [history, setHistory] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPortalData = async () => {
    try {
      // Fetch clients to identify current client
      const clientsRes = await fetch('/api/clients');
      const clientsData = await clientsRes.json();
      if (clientsData.success) {
        const foundClient = clientsData.data.find(c => c._id === clientId);
        setClient(foundClient);
      }

      // Fetch portal
      const portalRes = await fetch(`/api/portals/${clientId}`);
      const portalData = await portalRes.json();
      if (portalData.success && portalData.data) {
        setPortal(portalData.data);
        // Trigger recommendations analysis
        fetchRecommendations(portalData.data);
      } else {
        setError(portalData.error || 'Portail non trouvé.');
      }

      // Fetch history
      const historyRes = await fetch(`/api/portals/${clientId}/history`);
      const historyData = await historyRes.json();
      if (historyData.success) {
        setHistory(historyData.data);
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
    fetchPortalData();
  }, [clientId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleManualChange = (field, value) => {
    setPortal(prev => {
      const updated = { ...prev, [field]: value };
      // Re-trigger recommendations on change
      fetchRecommendations(updated);
      return updated;
    });
  };

  const handleSaveConfig = async (e, desc = 'Mise à jour manuelle dans le studio') => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/portals/${portal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...portal, 
          modifiedBy: 'Admin',
          description: desc 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Configuration enregistrée et publiée !', 'success');
        // Refresh history
        const historyRes = await fetch(`/api/portals/${clientId}/history`);
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
        
        let responseMsg = `J'ai appliqué les modifications suivantes (${method === 'gemini' ? 'via Gemini' : 'moteur local'}) :\n` + 
          changes.map(c => `• ${c}`).join('\n') + 
          `\n\nVous pouvez voir le rendu dans le simulateur. N'oubliez pas d'enregistrer pour publier !`;
        
        setChatMessages(prev => [...prev, { role: 'ai', text: responseMsg }]);
        showToast('Modifications appliquées au simulateur !', 'info');
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Désolé, je n'ai pas pu traiter la demande : ${data.error}` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erreur technique : ${err.message}` }]);
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
    showToast('Suggestion appliquée au simulateur !', 'success');
  };

  const handleRestoreVersion = async (version) => {
    if (!confirm(`Voulez-vous vraiment restaurer la version ${version} ? Votre configuration actuelle sera sauvegardée dans l'historique.`)) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/portals/${portal._id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      });
      const data = await res.json();
      if (data.success) {
        setPortal(data.data);
        fetchRecommendations(data.data);
        showToast(`Version ${version} restaurée !`, 'success');
        // Refresh history
        const historyRes = await fetch(`/api/portals/${clientId}/history`);
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

  const handleAiAutoGenerate = async () => {
    if (!client) return;
    if (!confirm(`Voulez-vous que l'IA génère un portail complet pour le secteur "${client.sector}" ? Cela écrasera vos modifications non enregistrées.`)) {
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
        showToast('Nouveau template généré !', 'success');
        
        setChatMessages(prev => [...prev, { 
          role: 'ai', 
          text: `J'ai généré un template complet adapté au secteur "${client.sector}" (${data.data.method === 'gemini' ? 'via Gemini' : 'moteur local'}).\nExplication : ${data.data.explanation}\nVisualisez-le à droite, et cliquez sur "Enregistrer" pour valider.` 
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-slate-400">Chargement du studio de design...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass border-red-500/20 p-6 rounded-xl text-center max-w-md mx-auto my-12">
        <p className="text-red-400 font-semibold mb-2">Erreur du Studio</p>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button onClick={() => router.push('/dashboard/clients')} className="btn-secondary text-xs flex items-center gap-1 mx-auto">
          <ArrowLeft size={12} /> Retour aux clients
        </button>
      </div>
    );
  }

  // Visual simulation helpers
  const getTemplateStyle = () => {
    switch (portal.templateName) {
      case 'modern':
        return {
          background: `linear-gradient(180deg, ${portal.backgroundColor} 0%, #000 100%)`,
          fontFamily: 'system-ui',
          borderRadius: '0px',
        };
      case 'minimalist':
        return {
          background: portal.backgroundColor,
          fontFamily: 'serif',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.05)',
        };
      case 'classic':
        return {
          background: `radial-gradient(circle at center, ${portal.backgroundColor} 60%, #000 100%)`,
          fontFamily: 'Georgia, serif',
          borderRadius: '16px',
        };
      case 'glassmorphism':
      default:
        return {
          background: `radial-gradient(ellipse at top, ${portal.backgroundColor} 40%, #030712 100%)`,
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients">
            <button className="btn-secondary p-2 rounded-lg" title="Retour aux clients">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{portal.name || 'Studio Design'}</h2>
              <span className="badge badge-purple text-[0.65rem] py-0.5 capitalize">{client?.name}</span>
            </div>
            <p className="text-[0.7rem] text-slate-400">Modifier le style et le texte du portail. Version active: v{portal.version}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleAiAutoGenerate}
            disabled={aiWorking}
            className="btn-secondary text-xs flex-1 sm:flex-initial py-2 justify-center hover:border-purple-500/50"
            title="Générer automatiquement un portail adapté"
          >
            <Sparkles size={14} className="text-purple-400 mr-1" />
            Génération IA
          </button>
          <button 
            onClick={(e) => handleSaveConfig(e, 'Sauvegarde manuelle via Studio')}
            disabled={saving}
            className="btn-primary text-xs flex-1 sm:flex-initial py-2 justify-center"
          >
            {saving ? (
              <>
                <div className="spinner !w-3.5 !h-3.5" />
                Publication...
              </>
            ) : (
              <>
                <Save size={14} />
                Enregistrer & Publier
              </>
            )}
          </button>
        </div>
      </div>

      {/* Studio Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Tool Panels (cols 1 to 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tabs header */}
          <div className="glass p-1.5 rounded-xl border border-white/5 flex gap-1">
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'design' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🎨 Style Manuel
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex justify-center items-center gap-1.5 ${activeTab === 'ai' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Zap size={12} className={activeTab === 'ai' ? 'text-white' : 'text-purple-400'} />
              Studio IA Chat
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🕐 Historique ({history.length})
            </button>
          </div>

          {/* TAB 1: MANUAL DESIGN */}
          {activeTab === 'design' && (
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-5 fade-in">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Options visuelles & Contenu</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nom du portail</label>
                  <input
                    type="text"
                    value={portal.name}
                    onChange={(e) => handleManualChange('name', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Template visuel</label>
                  <select
                    value={portal.templateName}
                    onChange={(e) => handleManualChange('templateName', e.target.value)}
                    className="form-input bg-[#090e1a]"
                  >
                    <option value="glassmorphism">Glassmorphism (Premium)</option>
                    <option value="modern">Modern (Flat)</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Boutons & Accents</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={portal.primaryColor}
                      onChange={(e) => handleManualChange('primaryColor', e.target.value)}
                      className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <code className="text-xs text-slate-300 font-mono uppercase">{portal.primaryColor}</code>
                  </div>
                </div>

                <div>
                  <label className="form-label">Couleur de Fond</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={portal.backgroundColor}
                      onChange={(e) => handleManualChange('backgroundColor', e.target.value)}
                      className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <code className="text-xs text-slate-300 font-mono uppercase">{portal.backgroundColor}</code>
                  </div>
                </div>

                <div>
                  <label className="form-label">Couleur du texte</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={portal.textColor}
                      onChange={(e) => handleManualChange('textColor', e.target.value)}
                      className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <code className="text-xs text-slate-300 font-mono uppercase">{portal.textColor}</code>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Méthode d'Authentification</label>
                  <select
                    value={portal.authType}
                    onChange={(e) => handleManualChange('authType', e.target.value)}
                    className="form-input bg-[#090e1a]"
                  >
                    <option value="button">Bouton simple "Se connecter"</option>
                    <option value="email">Formulaire Email</option>
                    <option value="phone">Numéro de Téléphone (SMS)</option>
                    <option value="login">Nom d'utilisateur & Mot de passe</option>
                    <option value="voucher">Code Voucher (Ticket)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Texte du Bouton</label>
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

              <div>
                <label className="form-label">URL du logo (Optionnel)</label>
                <input
                  type="text"
                  placeholder="https://exemple.com/logo.png"
                  value={portal.logoUrl}
                  onChange={(e) => handleManualChange('logoUrl', e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">URL Bannière Promotionnelle (Optionnel)</label>
                <input
                  type="text"
                  placeholder="https://exemple.com/promo.jpg"
                  value={portal.promoBannerUrl}
                  onChange={(e) => handleManualChange('promoBannerUrl', e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Conditions d'utilisation (RGPD)</label>
                <textarea
                  rows="2"
                  value={portal.termsOfUse}
                  onChange={(e) => handleManualChange('termsOfUse', e.target.value)}
                  className="form-input resize-none text-slate-300 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AI ASSISTANT CHAT */}
          {activeTab === 'ai' && (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[480px] fade-in">
              {/* Chat messages */}
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
                    <span>L'IA analyse vos instructions et adapte le portail...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
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

          {/* TAB 3: VERSION HISTORY */}
          {activeTab === 'history' && (
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-4 fade-in">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Historique des versions de configuration</h3>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Aucune version sauvegardée pour le moment. Enregistrez vos premières modifications pour créer un historique.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div key={h._id || h.version} className="flex justify-between items-center border border-white/5 rounded-xl p-3 bg-white/[0.02] hover:bg-white/[0.04] transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-400">Version {h.version}</span>
                          <span className="text-[0.7rem] text-slate-400">• modifiée par <b className="text-slate-300 font-semibold">{h.modifiedBy}</b></span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{h.description || 'Aucune description'}</p>
                        <p className="text-[0.65rem] text-slate-500 mt-0.5">{new Date(h.modifiedAt).toLocaleString('fr-FR')}</p>
                      </div>

                      {h.version !== portal.version && (
                        <button 
                          onClick={() => handleRestoreVersion(h.version)}
                          className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
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

          {/* AI Suggestions widget (available in all tabs) */}
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              Recommandations IA en temps réel
            </h4>

            {aiSuggestions.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle size={14} /> Votre portail respecte toutes les règles d'ergonomie et de RGPD !
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="border border-white/5 bg-white/[0.01] p-3 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200">{sug.title}</span>
                        <span className={`text-[0.6rem] px-2 py-0.5 rounded-full font-bold ${sug.type === 'warning' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {sug.type}
                        </span>
                      </div>
                      <p className="text-[0.72rem] text-slate-400 mt-1 leading-relaxed">{sug.message}</p>
                    </div>
                    {sug.fix && (
                      <button 
                        onClick={() => handleApplySuggestion(sug.fix)}
                        className="btn-secondary text-[0.7rem] py-1 justify-center w-full mt-1 border-purple-500/20 hover:border-purple-500/50 text-purple-300"
                      >
                        <Sparkles size={10} className="mr-1" />
                        Corriger automatiquement
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive phone mockup (cols 8 to 12) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start sticky top-20">
          <div className="text-center mb-3">
            <span className="badge badge-info text-[0.65rem] uppercase font-bold tracking-wider flex items-center gap-1">
              <Smartphone size={10} />
              Simulateur Mobile Live
            </span>
            <p className="text-[0.65rem] text-slate-400 mt-1">Rendu instantané des modifications de style</p>
          </div>

          {/* Device Frame wrapper */}
          <div className="phone-mockup">
            <div className="phone-screen" style={getTemplateStyle()}>
              {/* Virtual phone status bar */}
              <div className="flex justify-between items-center px-6 pt-11 pb-2 text-[0.65rem] font-bold text-white/50 select-none">
                <span>09:41</span>
                <span className="flex items-center gap-1">📶 📡 🔋</span>
              </div>

              {/* Portal Content simulator */}
              <div 
                className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center justify-between text-center"
                style={{ color: portal.textColor }}
              >
                {/* Logo or icon */}
                <div className="w-full flex justify-center py-2">
                  {portal.logoUrl ? (
                    <img 
                      src={portal.logoUrl} 
                      alt="Logo" 
                      className="max-h-12 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }} // fallback if bad URL
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: portal.primaryColor,
                      display: 'flex', alignItems: 'center', justify: 'center',
                      color: '#fff', fontSize: 20, fontWeight: 900,
                      boxShadow: `0 0 20px ${portal.primaryColor}50`
                    }}>
                      {client?.name ? client.name.charAt(0).toUpperCase() : 'W'}
                    </div>
                  )}
                </div>

                {/* Body & Welcome Message */}
                <div className="space-y-3 my-4">
                  <h3 className="text-base font-extrabold tracking-tight leading-snug">
                    {portal.name || 'Accès Wi-Fi gratuit'}
                  </h3>
                  <p className="text-xs opacity-80 leading-relaxed font-normal">
                    {portal.welcomeText}
                  </p>
                </div>

                {/* Promotional banner if exists */}
                {portal.promoBannerUrl && (
                  <div className="w-full rounded-xl overflow-hidden border border-white/5 my-2">
                    <img src={portal.promoBannerUrl} alt="Promotion" className="w-full h-16 object-cover" />
                  </div>
                )}

                {/* Form fields depending on AuthType */}
                <div className="w-full space-y-3 my-4">
                  {portal.authType === 'email' && (
                    <input 
                      type="email" 
                      placeholder="Votre adresse email" 
                      disabled
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  )}
                  {portal.authType === 'phone' && (
                    <input 
                      type="tel" 
                      placeholder="Votre numéro de mobile" 
                      disabled
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  )}
                  {portal.authType === 'login' && (
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Identifiant" 
                        disabled
                        className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-white/40 focus:outline-none"
                      />
                      <input 
                        type="password" 
                        placeholder="Mot de passe" 
                        disabled
                        className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-white/40 focus:outline-none"
                      />
                    </div>
                  )}
                  {portal.authType === 'voucher' && (
                    <input 
                      type="text" 
                      placeholder="Code voucher de connexion" 
                      disabled
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  )}

                  {/* Connect Button */}
                  <button 
                    style={{ 
                      background: portal.primaryColor,
                      color: '#fff',
                      boxShadow: `0 8px 20px ${portal.primaryColor}40`
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition transform active:scale-95"
                  >
                    {portal.buttonText}
                  </button>
                </div>

                {/* Footer RGPD */}
                <p className="text-[0.55rem] opacity-60 leading-normal max-h-16 overflow-y-auto px-2">
                  {portal.termsOfUse}
                </p>
              </div>

              {/* Virtual phone navigation bar (home indicator) */}
              <div className="flex justify-center items-center py-2">
                <div className="w-24 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <a 
              href={`/portal/${client?.slug}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <Eye size={12} />
              Ouvrir la page de connexion réelle dans un nouvel onglet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
