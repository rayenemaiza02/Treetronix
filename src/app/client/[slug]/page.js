'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Sparkles, RefreshCw, Send, CheckCircle, 
  Eye, Undo, Smartphone, AlertTriangle, Zap, BarChart2, Users, Radio, LogOut, ChevronRight, X, Check, Sliders
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

  // Concept Prompt state for High-level IA Generation
  const [conceptPrompt, setConceptPrompt] = useState('');

  // Étape 8: Treetronix AI Copilot 3-Variant Generation States
  const [copilotModalOpen, setCopilotModalOpen] = useState(false);
  const [copilotFormData, setCopilotFormData] = useState({
    name: '',
    sector: '',
    style: 'Premium, élégant et méditerranéen',
    goal: 'Collecter les emails des visiteurs et promouvoir le spa',
    description: 'Établissement haut de gamme soucieux de l\'expérience client'
  });
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [previewVariant, setPreviewVariant] = useState(null);
  const [savedPortalSnapshot, setSavedPortalSnapshot] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

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
        const previousVersion = await applyAiResultWithSnapshot(config, "Modification par instruction");

        let responseMsg = `J'ai adapté votre portail selon vos consignes (${method === 'gemini' ? 'via Gemini' : 'moteur local'}) :\n` + 
          changes.map(c => `• ${c}`).join('\n') + 
          `\n\n🛡️ **Application Sans Risque** : Un snapshot de sauvegarde (Version ${previousVersion}) a été créé dans l'onglet "Versions". Si le résultat ne vous convient pas, restaurez la version précédente à tout moment !`;
        
        setChatMessages(prev => [...prev, { role: 'ai', text: responseMsg }]);
        showToast('Modifications appliquées et sauvegardées !', 'info');
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Désolé, une erreur est survenue : ${data.error}` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erreur : ${err.message}` }]);
    } finally {
      setAiWorking(false);
    }
  };

  const handleAiAutoGenerate = async (customPrompt = '') => {
    if (!client) return;
    const promptToUse = typeof customPrompt === 'string' && customPrompt ? customPrompt : conceptPrompt;

    setAiWorking(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          sector: client.sector,
          clientName: client.name,
          businessGoalPrompt: promptToUse
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const previousVersion = await applyAiResultWithSnapshot(data.data.config, "Génération par Concept IA");
        showToast('Nouveau portail conçu sur-mesure par l\'IA !', 'success');
        
        setChatMessages(prev => [...prev, { 
          role: 'ai', 
          text: `✨ **Nouveau Portail Conçu par l'IA** :\n${data.data.explanation}\n\n🛡️ **Application Sans Risque** : Version ${previousVersion} sauvegardée dans l'onglet "Versions".` 
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

  const handleAiOptimize = async () => {
    if (!portal) return;
    setAiWorking(true);
    setChatMessages(prev => [...prev, { role: 'user', text: "Optimiser mon portail selon les performances réelles" }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          currentConfig: portal,
          analyticsData: stats
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const { config, changes, explanation, method } = data.data;
        const previousVersion = await applyAiResultWithSnapshot(config, "Optimisation stratégique IA");
        
        let responseMsg = `🎯 **Optimisation Stratégique IA (${method === 'gemini-optimizer' ? 'via Gemini' : 'moteur déterministe'})** :\n${explanation}\n\n` + 
          `**Ajustements appliqués** :\n` + changes.map(c => `• ${c}`).join('\n') + 
          `\n\n🛡️ **Application Sans Risque** : Un snapshot de la Version ${previousVersion} a été automatiquement archivé dans l'onglet "Versions". Vous pouvez revenir en arrière à tout moment !`;
        
        setChatMessages(prev => [...prev, { role: 'ai', text: responseMsg }]);
        showToast('Portail optimisé et sauvegardé !', 'success');
      } else {
        showToast(data.error || 'Erreur lors de l\'optimisation', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAiWorking(false);
    }
  };

  const handleApplyThemeDirect = async (instructionText, themeName) => {
    if (aiWorking) return;
    setAiWorking(true);
    setChatMessages(prev => [...prev, { role: 'user', text: `Appliquer le ${themeName}` }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify',
          instructions: instructionText,
          currentConfig: portal
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const { config, changes, method } = data.data;
        const previousVersion = await applyAiResultWithSnapshot(config, `Thème ${themeName}`);
        
        let responseMsg = `J'ai appliqué le ${themeName} (${method === 'gemini' ? 'via Gemini' : 'moteur local'}) :\n` + 
          changes.map(c => `• ${c}`).join('\n') + 
          `\n\n🛡️ **Application Sans Risque** : Un snapshot (Version ${previousVersion}) a été conservé dans l'onglet "Versions". Cliquez sur "Restaurer" si vous souhaitez annuler.`;
        
        setChatMessages(prev => [...prev, { role: 'ai', text: responseMsg }]);
        showToast(`Thème "${themeName}" appliqué et sauvegardé !`, 'success');
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Désolé, une erreur est survenue : ${data.error}` }]);
        showToast(data.error || 'Erreur lors de l\'application du thème', 'error');
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Erreur : ${err.message}` }]);
      showToast(err.message, 'error');
    } finally {
      setAiWorking(false);
    }
  };

  const applyAiResultWithSnapshot = async (newConfig, actionDescription) => {
    const previousVersion = portal.version || 1;
    const targetPortalId = portal._id || portal.id;

    setPortal(newConfig);
    fetchRecommendations(newConfig);

    try {
      const saveRes = await fetch(`/api/portals/${targetPortalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          modifiedBy: 'Assistant IA',
          description: `Application IA : ${actionDescription}`
        })
      });
      const saveData = await saveRes.json();
      if (saveData.success && saveData.data) {
        setPortal(saveData.data);
        const historyRes = await fetch(`/api/portals/${client._id}/history`, { cache: 'no-store' });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data);
        }
      }
    } catch (err) {
      console.warn("Erreur d'enregistrement d'historique IA:", err);
    }

    return previousVersion;
  };

  // ---- Étape 8: Copilot 3-Variant Generation Handlers ----

  const handleGenerate3Variants = async (overrideForm = null) => {
    const formData = overrideForm || copilotFormData;
    setCopilotLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate3Variants',
          clientName: formData.name || client?.name || 'Mon Établissement',
          sector: formData.sector || client?.sector || 'Hôtel',
          style: formData.style,
          goal: formData.goal,
          description: formData.description,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.variants) {
        setGeneratedVariants(data.data.variants);
        setPreviewVariant(null);
        showToast('3 propositions générées avec succès !', 'success');
      } else {
        showToast(data.error || 'Erreur lors de la génération', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCopilotLoading(false);
    }
  };

  const handlePreviewVariant = (variant) => {
    if (!savedPortalSnapshot) {
      setSavedPortalSnapshot({ ...portal });
    }
    setPreviewVariant(variant);
    setPortal(prev => ({
      ...prev,
      ...variant.config
    }));
  };

  const handleExitPreview = () => {
    if (savedPortalSnapshot) {
      setPortal(savedPortalSnapshot);
    }
    setPreviewVariant(null);
  };

  const handleCancelCopilot = () => {
    if (savedPortalSnapshot) {
      setPortal(savedPortalSnapshot);
      setSavedPortalSnapshot(null);
    }
    setPreviewVariant(null);
    setGeneratedVariants([]);
    setCopilotModalOpen(false);
    showToast('Aperçu annulé. Portail rétabli à son état d\'origine.', 'info');
  };

  const handleKeepForManualEdit = () => {
    setSavedPortalSnapshot(null);
    setPreviewVariant(null);
    setGeneratedVariants([]);
    setCopilotModalOpen(false);
    showToast('Variante conservée dans le studio pour édition manuelle.', 'info');
  };

  const handleUseChosenDesign = async () => {
    if (!previewVariant) return;
    setSaving(true);
    try {
      const targetPortalId = portal?._id || portal?.id || client?._id || client?.id;
      const saveRes = await fetch(`/api/portals/${targetPortalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...portal,
          modifiedBy: 'Treetronix AI Copilot',
          description: `Création IA : application du concept ${previewVariant.name}`
        })
      });
      const saveData = await saveRes.json();
      if (saveData.success && saveData.data) {
        setPortal(saveData.data);
        setSavedPortalSnapshot(null);
        setPreviewVariant(null);
        setGeneratedVariants([]);
        setCopilotModalOpen(false);
        
        const historyClientId = client?._id || client?.id || portal?.clientId;
        if (historyClientId) {
          try {
            const historyRes = await fetch(`/api/portals/${historyClientId}/history`, { cache: 'no-store' });
            const historyData = await historyRes.json();
            if (historyData.success) {
              setHistory(historyData.data);
            }
          } catch (histErr) {
            console.warn('History refresh warning:', histErr.message);
          }
        }

        showToast(`Concept "${previewVariant.name}" enregistré dans Supabase !`, 'success');
      } else {
        showToast(saveData.error || 'Erreur lors de l\'enregistrement', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateTraffic = async () => {
    if (!portal) return;
    setSaving(true);
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalId: portal._id || portal.id,
          count: 30
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('30 connexions Wi-Fi simulées avec succès dans Supabase !', 'success');
        fetchClientPortalData();
      } else {
        showToast(data.error || 'Erreur lors de la simulation', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
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
            <div className="space-y-5 fade-in">
              {/* SECTION PRINCIPALE : STUDIO DE GENERATION PAR IA */}
              <div className="glass p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white tracking-wide">Treetronix AI Copilot</h3>
                      <p className="text-[0.7rem] text-slate-400">Générez 3 concepts visuels et stratégiques complets sur-mesure pour votre établissement.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCopilotFormData({
                          name: client?.name || '',
                          sector: client?.sector || '',
                          style: 'Premium, élégant et méditerranéen',
                          goal: 'Collecter les emails des visiteurs et promouvoir le spa',
                          description: 'Établissement 4 étoiles en bord de mer'
                        });
                        setCopilotModalOpen(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-lg shadow-purple-500/20"
                    >
                      <Sparkles size={14} className="text-purple-300" />
                      Créer avec l'IA (3 propositions)
                    </button>
                    <button
                      onClick={handleAiOptimize}
                      disabled={aiWorking}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold hover:text-yellow-300"
                      title="Analyse les performances réelles pour optimiser le portail"
                    >
                      <Zap size={14} className="text-yellow-300" />
                      Optimiser par Analytics
                    </button>
                  </div>
                </div>

                {/* Section 3 Cartes de Propositions IA (Étape 8) */}
                {generatedVariants.length > 0 && (
                  <div className="p-4 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-cyan-950/30 space-y-4 fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          3 propositions générées par Treetronix AI
                        </h3>
                        <p className="text-[0.7rem] text-slate-400">
                          Cliquez sur "Aperçu" pour charger temporairement le concept dans le simulateur.
                        </p>
                      </div>
                      <button
                        onClick={() => handleGenerate3Variants()}
                        disabled={copilotLoading}
                        className="btn-secondary text-[0.7rem] py-1 px-2.5 flex items-center gap-1 hover:text-purple-300"
                      >
                        <RefreshCw size={12} className={copilotLoading ? "animate-spin" : ""} />
                        Régénérer 3 propositions
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {generatedVariants.map((variant, idx) => {
                        const isPreviewing = previewVariant?.name === variant.name;
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                              isPreviewing
                                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500'
                                : 'border-white/10 hover:border-purple-500/40 bg-black/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[0.65rem] font-extrabold text-purple-400 uppercase tracking-wider">Concept {idx + 1}</span>
                                {isPreviewing && (
                                  <span className="badge badge-purple text-[0.6rem] py-0.5 px-2">Aperçu</span>
                                )}
                              </div>
                              <h4 className="text-xs font-extrabold text-white">{variant.name}</h4>
                              <p className="text-[0.68rem] text-slate-400 leading-relaxed line-clamp-2">{variant.description}</p>
                            </div>

                            {/* Color Badges */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                              <div className="flex items-center justify-between text-[0.65rem] text-slate-400">
                                <span>Palette :</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: variant.config.backgroundColor }} title={`Fond: ${variant.config.backgroundColor}`} />
                                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: variant.config.primaryColor }} title={`Bouton: ${variant.config.primaryColor}`} />
                                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: variant.config.textColor }} title={`Texte: ${variant.config.textColor}`} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[0.65rem] text-slate-400">
                                <span>Auth : <strong className="text-slate-200 uppercase">{variant.config.authType}</strong></span>
                                <span>Style : <strong className="text-slate-200 capitalize">{variant.config.templateName}</strong></span>
                              </div>

                              {variant.config.promoText && (
                                <p className="text-[0.65rem] text-cyan-300 bg-cyan-950/40 border border-cyan-800/30 p-1.5 rounded line-clamp-1">
                                  🎁 {variant.config.promoText}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handlePreviewVariant(variant)}
                              className={`w-full py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                                isPreviewing ? 'bg-purple-600 text-white' : 'btn-secondary hover:border-purple-500/50'
                              }`}
                            >
                              <Eye size={12} />
                              {isPreviewing ? 'Aperçu Actif' : 'Aperçu'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grille de Cartes de Génération et Thèmes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Carte 1 : Génération par Secteur */}
                  <div 
                    onClick={handleAiAutoGenerate}
                    className="group border border-purple-500/20 hover:border-purple-500/50 bg-white/[0.02] hover:bg-purple-500/10 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-purple-500/15 rounded-lg text-purple-300 group-hover:scale-105 transition">
                        <Zap size={18} />
                      </div>
                      <span className="text-[0.65rem] font-bold text-purple-400 bg-purple-500/10 py-0.5 px-2 rounded-full">Recommandé</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Génération Complète par Secteur</h4>
                      <p className="text-[0.68rem] text-slate-400 mt-1 leading-relaxed">
                        Conçoit un design complet adapté à votre activité <strong className="text-slate-300">"{client?.sector || 'enseigne'}"</strong>.
                      </p>
                    </div>
                    <div className="text-[0.7rem] font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Générer maintenant <ChevronRight size={12} />
                    </div>
                  </div>

                  {/* Carte 2 : Thème Promo & Soldes */}
                  <div 
                    onClick={() => handleApplyThemeDirect("Applique un thème dynamique de promotion avec des couleurs vives, une bannière d'offre promotionnelle et un bouton percutant rouge ou orange", "Thème Promotionnel & Ventes")}
                    className="group border border-white/5 hover:border-cyan-500/50 bg-white/[0.02] hover:bg-cyan-500/10 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-cyan-500/15 rounded-lg text-cyan-300 group-hover:scale-105 transition">
                        <Sparkles size={18} />
                      </div>
                      <span className="text-[0.65rem] font-bold text-cyan-400 bg-cyan-500/10 py-0.5 px-2 rounded-full">Style Offre</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Thème Promotionnel &amp; Ventes</h4>
                      <p className="text-[0.68rem] text-slate-400 mt-1 leading-relaxed">
                        Couleurs dynamiques, bannières d'offres promotionnelles et boutons d'action à fort impact.
                      </p>
                    </div>
                    <div className="text-[0.7rem] font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Appliquer le thème <ChevronRight size={12} />
                    </div>
                  </div>

                  {/* Carte 3 : Thème Luxe & Sombre */}
                  <div 
                    onClick={() => handleApplyThemeDirect("Applique un thème sombre très élégant, style glassmorphism avec fond dépoli, contours violets ou dorés et typographie raffinée", "Thème Sombre Premium & Glass")}
                    className="group border border-white/5 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/10 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-indigo-500/15 rounded-lg text-indigo-300 group-hover:scale-105 transition">
                        <Radio size={18} />
                      </div>
                      <span className="text-[0.65rem] font-bold text-indigo-400 bg-indigo-500/10 py-0.5 px-2 rounded-full">Luxe</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Thème Sombre Premium &amp; Glass</h4>
                      <p className="text-[0.68rem] text-slate-400 mt-1 leading-relaxed">
                        Effet dépoli futuriste, typographie haut de gamme et tons contrastés élégants.
                      </p>
                    </div>
                    <div className="text-[0.7rem] font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Appliquer le thème <ChevronRight size={12} />
                    </div>
                  </div>

                  {/* Carte 4 : Thème Éco & Minimaliste */}
                  <div 
                    onClick={() => handleApplyThemeDirect("Applique un style minimaliste épuré avec fond vert clair ou beige très doux, typographie serif élégante et bouton vert nature", "Thème Épuré & Minimaliste")}
                    className="group border border-white/5 hover:border-emerald-500/50 bg-white/[0.02] hover:bg-emerald-500/10 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-emerald-500/15 rounded-lg text-emerald-300 group-hover:scale-105 transition">
                        <CheckCircle size={18} />
                      </div>
                      <span className="text-[0.65rem] font-bold text-emerald-400 bg-emerald-500/10 py-0.5 px-2 rounded-full">Éco / Nature</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Thème Épuré &amp; Minimaliste</h4>
                      <p className="text-[0.68rem] text-slate-400 mt-1 leading-relaxed">
                        Design sobre, tons doux et naturels, idéal pour une expérience utilisateur simple et apaisante.
                      </p>
                    </div>
                    <div className="text-[0.7rem] font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Appliquer le thème <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION SECONDAIRE : ASSISTANT CONVERSATIONNEL & RETOUCHES */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[280px]">
                <div className="bg-white/[0.02] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Send size={12} className="text-purple-400" />
                    Assistant Conversationnel &amp; Retouches Précises
                  </span>
                  <span className="text-[0.65rem] text-slate-500">Posez des consignes spécifiques</span>
                </div>

                {/* Chat bubbles */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
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
                <form onSubmit={handleAiInstruction} className="p-2.5 bg-black/30 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 'Change uniquement la couleur du bouton en rouge'"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={aiWorking}
                    className="form-input flex-1 bg-white/5 text-xs py-2"
                  />
                  <button 
                    type="submit" 
                    disabled={aiWorking || !chatInput.trim()}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
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
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fréquentation de votre réseau</h3>
                <button
                  onClick={handleSimulateTraffic}
                  disabled={saving}
                  className="btn-secondary text-[0.7rem] py-1 px-3 flex items-center gap-1.5 hover:border-purple-500/50 hover:text-purple-300 transition"
                  title="Génère un jeu de données réalistes de démonstration dans Supabase"
                >
                  <RefreshCw size={12} className={saving ? "animate-spin" : ""} />
                  🎲 Simuler 30 connexions Wi-Fi
                </button>
              </div>

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

          {/* Étape 8: Live Preview Toolbar & AI Explanations */}
          {previewVariant && (
            <div className="w-full mb-4 glass p-4 rounded-xl border border-purple-500/50 bg-purple-950/40 space-y-3 fade-in shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <span className="text-[0.65rem] font-bold text-purple-400 uppercase tracking-wider">Aperçu Live Temporaire</span>
                  <h4 className="text-xs font-extrabold text-white">{previewVariant.name}</h4>
                </div>
                <span className="text-[0.6rem] font-bold text-yellow-300 bg-yellow-950/60 border border-yellow-700/50 px-2 py-0.5 rounded">
                  Non Enregistré
                </span>
              </div>

              <div className="space-y-1.5 text-[0.68rem] text-slate-300">
                <p><strong>🎨 Design :</strong> {previewVariant.explanation.design}</p>
                <p><strong>🔑 Authentification :</strong> {previewVariant.explanation.authentication}</p>
                <p><strong>📈 Marketing :</strong> {previewVariant.explanation.marketing}</p>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
                <button
                  onClick={handleUseChosenDesign}
                  disabled={saving}
                  className="w-full btn-primary text-xs py-2 font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/30"
                >
                  <Check size={14} />
                  Utiliser ce design
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleExitPreview}
                    className="btn-secondary text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                  >
                    <ChevronRight size={12} />
                    Voir une autre proposition
                  </button>

                  <button
                    onClick={() => handleGenerate3Variants()}
                    disabled={copilotLoading}
                    className="btn-secondary text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={12} className={copilotLoading ? "animate-spin" : ""} />
                    Régénérer 3 propositions
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleKeepForManualEdit}
                    className="btn-secondary text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                  >
                    <Sliders size={12} />
                    Modifier manuellement
                  </button>

                  <button
                    onClick={handleCancelCopilot}
                    className="btn-secondary text-[0.65rem] py-1.5 px-2 text-red-400 hover:text-red-300 border-red-500/20 flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

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

      {/* Modal Form Copilot IA (Étape 8) */}
      {copilotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 fade-in">
          <div className="glass p-6 rounded-2xl border border-purple-500/30 max-w-lg w-full space-y-5 bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Treetronix AI Copilot</h3>
                  <p className="text-[0.7rem] text-slate-400">Générez 3 concepts uniques adaptés à vos objectifs métier.</p>
                </div>
              </div>
              <button
                onClick={() => setCopilotModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate3Variants();
                setCopilotModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="form-label">Nom de l'établissement</label>
                <input
                  type="text"
                  required
                  value={copilotFormData.name}
                  onChange={(e) => setCopilotFormData({ ...copilotFormData, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Hôtel Marina Hammamet"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Secteur d'activité</label>
                  <input
                    type="text"
                    required
                    value={copilotFormData.sector}
                    onChange={(e) => setCopilotFormData({ ...copilotFormData, sector: e.target.value })}
                    className="form-input"
                    placeholder="Ex: Hôtel, Restaurant, Café..."
                  />
                </div>
                <div>
                  <label className="form-label">Style recherché</label>
                  <input
                    type="text"
                    required
                    value={copilotFormData.style}
                    onChange={(e) => setCopilotFormData({ ...copilotFormData, style: e.target.value })}
                    className="form-input"
                    placeholder="Ex: Premium, épuré, méditerranéen..."
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Objectif principal</label>
                <input
                  type="text"
                  required
                  value={copilotFormData.goal}
                  onChange={(e) => setCopilotFormData({ ...copilotFormData, goal: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Collecter les emails et promouvoir le spa"
                />
              </div>

              <div>
                <label className="form-label">Description complémentaire (optionnel)</label>
                <textarea
                  rows="2"
                  value={copilotFormData.description}
                  onChange={(e) => setCopilotFormData({ ...copilotFormData, description: e.target.value })}
                  className="form-input resize-none"
                  placeholder="Ex: Hôtel 4 étoiles situé à Hammamet en bord de mer..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCopilotModalOpen(false)}
                  className="flex-1 btn-secondary text-xs py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={copilotLoading}
                  className="flex-1 btn-primary text-xs py-2 font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  Générer mes 3 propositions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
