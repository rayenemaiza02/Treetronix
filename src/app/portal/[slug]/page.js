'use client';

import { useState, useEffect } from 'react';
import { Wifi, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function PublicCaptivePortal({ params }) {
  const slug = params.slug;

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const fetchPortalConfig = async () => {
    try {
      const res = await fetch(`/api/portal/${slug}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error("Impossible de récupérer la configuration du portail.");
      }
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalConfig();
  }, [slug]);

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnecting(true);

    try {
      // Log connection to stats backend
      const res = await fetch(`/api/portal/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authTypeUsed: config.authType,
          status: 'success'
        })
      });
      
      if (res.ok) {
        // Simulate network authorization delay
        setTimeout(() => {
          setConnecting(false);
          setConnected(true);
        }, 1500);
      } else {
        throw new Error("Échec de l'enregistrement de la session.");
      }
    } catch (err) {
      setConnecting(false);
      alert("Erreur lors de la tentative de connexion Wi-Fi : " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] gap-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-400">Initialisation de la redirection Wi-Fi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] p-6 text-center">
        <div className="glass border-red-500/20 p-6 rounded-2xl max-w-md space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Erreur de redirection</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <p className="text-[0.7rem] text-slate-500">Le routeur ou le système GlobalNet tente de contacter un client invalide : "{slug}"</p>
        </div>
      </div>
    );
  }

  // Get dynamic styles based on configuration
  const getTemplateStyle = () => {
    const baseStyle = {};
    if (config.backgroundImage) {
      baseStyle.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url(${config.backgroundImage})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
    }

    switch (config.templateName) {
      case 'modern':
        return {
          background: config.backgroundImage 
            ? baseStyle.backgroundImage 
            : `linear-gradient(180deg, ${config.backgroundColor} 0%, #000 100%)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: config.textColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'minimalist':
        return {
          background: config.backgroundImage ? baseStyle.backgroundImage : config.backgroundColor,
          fontFamily: 'Georgia, serif',
          color: config.textColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'classic':
        return {
          background: config.backgroundImage 
            ? baseStyle.backgroundImage 
            : `radial-gradient(circle at center, ${config.backgroundColor} 60%, #000 100%)`,
          fontFamily: 'serif',
          color: config.textColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'glassmorphism':
      default:
        return {
          background: config.backgroundImage 
            ? `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url(${config.backgroundImage})` 
            : `radial-gradient(ellipse at top, ${config.backgroundColor} 40%, #030712 100%)`,
          backdropFilter: 'blur(10px)',
          fontFamily: 'inherit',
          color: config.textColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
    }
  };

  const isGlass = config.templateName === 'glassmorphism' || !config.templateName;

  return (
    <main 
      style={getTemplateStyle()} 
      className="min-h-screen flex flex-col justify-between items-center p-6 relative overflow-hidden"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Header status bar */}
      <div className="w-full max-w-md flex justify-between items-center text-[0.7rem] opacity-60 font-semibold select-none">
        <div className="flex items-center gap-1">
          <Wifi size={12} style={{ color: config.primaryColor }} className="animate-pulse" />
          <span>Wi-Fi Captif GlobalNet</span>
        </div>
        <span>Sécurisé par Treetronix</span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md my-auto py-8">
        {!connected ? (
          <div className={`p-8 rounded-3xl ${isGlass ? 'glass backdrop-blur-xl border-white/5' : 'bg-black/35 border border-white/5'} space-y-6 shadow-2xl`}>
            {/* Logo */}
            <div className="flex justify-center">
              {config.logo ? (
                <img src={config.logo} alt="Logo" className="max-h-16 object-contain" />
              ) : (
                <div 
                  style={{ 
                    background: config.primaryColor,
                    boxShadow: `0 0 20px ${config.primaryColor}60`
                  }} 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                >
                  {config.client.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Welcome messages */}
            <div className="text-center space-y-2">
              <h1 className="text-xl font-extrabold tracking-tight">{config.name || 'Accès Internet'}</h1>
              <p className="text-xs opacity-80 leading-relaxed max-w-xs mx-auto">
                {config.welcomeText}
              </p>
            </div>

            {/* Promo banner if present */}
            {config.promoBanner && (
              <div className="rounded-xl overflow-hidden border border-white/5 shadow-md">
                <img src={config.promoBanner} alt="Offre Spéciale" className="w-full h-24 object-cover" />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConnect} className="space-y-4">
              {config.authType === 'email' && (
                <div>
                  <label className="block text-[0.7rem] uppercase tracking-wider opacity-60 mb-1.5 font-bold">Adresse Email</label>
                  <input
                    type="email"
                    required
                    placeholder="email@exemple.com"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-purple-500 text-white"
                  />
                </div>
              )}

              {config.authType === 'phone' && (
                <div>
                  <label className="block text-[0.7rem] uppercase tracking-wider opacity-60 mb-1.5 font-bold">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+216 -- --- ---"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-purple-500 text-white"
                  />
                </div>
              )}

              {config.authType === 'login' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[0.7rem] uppercase tracking-wider opacity-60 mb-1.5 font-bold">Identifiant</label>
                    <input
                      type="text"
                      required
                      placeholder="Nom d'utilisateur"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] uppercase tracking-wider opacity-60 mb-1.5 font-bold">Mot de passe</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-purple-500 text-white"
                    />
                  </div>
                </div>
              )}

              {config.authType === 'voucher' && (
                <div>
                  <label className="block text-[0.7rem] uppercase tracking-wider opacity-60 mb-1.5 font-bold">Code Voucher</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisissez votre code de ticket"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-purple-500 text-white"
                  />
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={connecting}
                style={{ 
                  background: config.primaryColor,
                  color: '#fff',
                  boxShadow: `0 8px 25px ${config.primaryColor}50`
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition transform active:scale-98 flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Autorisation en cours...
                  </>
                ) : (
                  config.buttonText
                )}
              </button>
            </form>

            {/* Terms of Use */}
            <p className="text-[0.62rem] opacity-50 text-center leading-relaxed">
              {config.termsOfUse}
            </p>
          </div>
        ) : (
          /* Connection Success Screen */
          <div className={`p-8 rounded-3xl ${isGlass ? 'glass backdrop-blur-xl border-white/5' : 'bg-black/35 border border-white/5'} text-center space-y-6 shadow-2xl fade-in`}>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-100">Vous êtes connecté !</h2>
              <p className="text-xs text-slate-400">Votre accès Wi-Fi haut débit a été activé sur le réseau de {config.client}.</p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="opacity-60">Adresse IP locale:</span>
                <span className="font-mono font-bold text-slate-300">192.168.10.154</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Adresse MAC:</span>
                <span className="font-mono font-bold text-slate-300">00:1A:2B:3C:4D:5E</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Passerelle réseau:</span>
                <span className="font-mono font-bold text-slate-300">GlobalNet Portal Gateway v2</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-2.5 px-4 rounded-lg border border-emerald-500/20">
              <ShieldCheck size={16} />
              Session sécurisée par chiffrement
            </div>

            <p className="text-[0.7rem] text-slate-500">
              Vous pouvez maintenant naviguer librement sur Internet ou utiliser vos applications habituelles.
            </p>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="w-full text-center text-[0.6rem] opacity-40 font-medium">
        Portail de redirection GlobalNet • Alimenté par la plateforme Treetronix SaaS
      </div>
    </main>
  );
}
