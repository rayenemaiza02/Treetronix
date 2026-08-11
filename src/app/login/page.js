'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, Lock, ChevronRight, AlertCircle, Loader2, Radio } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Role state: admin | client
  const [role, setRole] = useState('admin');
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Form inputs
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('admin');
  const [selectedClientSlug, setSelectedClientSlug] = useState('');
  const [clientPass, setClientPass] = useState('client123');

  // Interactive states
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Fetch clients for dropdown
  useEffect(() => {
    if (role === 'client') {
      setLoadingClients(true);
      fetch('/api/clients')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            setClients(data.data);
            setSelectedClientSlug(data.data[0].slug);
          }
        })
        .catch(err => console.error("Error loading clients:", err))
        .finally(() => setLoadingClients(false));
    }
  }, [role]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    // Simulate session loading
    setTimeout(() => {
      if (role === 'admin') {
        if (adminUser.trim() === 'admin' && adminPass === 'admin') {
          // Store mock admin session
          localStorage.setItem('treetronix_session', JSON.stringify({ role: 'admin', user: 'admin' }));
          router.push('/dashboard');
        } else {
          setLoginError('Identifiant ou mot de passe administrateur incorrect.');
          setLoggingIn(false);
        }
      } else {
        if (!selectedClientSlug) {
          setLoginError('Veuillez sélectionner un client.');
          setLoggingIn(false);
          return;
        }
        if (clientPass === 'client123' || (clientObj && clientObj.password && clientPass === clientObj.password)) {
          // Store mock client session
          const clientObj = clients.find(c => c.slug === selectedClientSlug);
          localStorage.setItem('treetronix_session', JSON.stringify({ role: 'client', name: clientObj.name, slug: selectedClientSlug }));
          router.push(`/client/${selectedClientSlug}`);
        } else {
          setLoginError('Mot de passe client incorrect (par défaut: client123).');
          setLoggingIn(false);
        }
      }
    }, 1200);
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-[#060918]">
      {/* Decorative Orbs */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Brand logo */}
      <div className="mb-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 border border-purple-400/20">
          <Radio size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Treetronix SaaS</h1>
          <p className="text-[0.7rem] text-slate-500 font-semibold uppercase tracking-wider">Portails Wi-Fi Intelligents</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl glass border border-white/5 shadow-2xl space-y-6">
        
        {/* Role Toggle Tabs */}
        <div className="p-1 bg-black/40 rounded-xl border border-white/5 flex gap-1">
          <button
            type="button"
            onClick={() => { setRole('admin'); setLoginError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${role === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shield size={14} />
            Administrateur
          </button>
          <button
            type="button"
            onClick={() => { setRole('client'); setLoginError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${role === 'client' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users size={14} />
            Client Partenaire
          </button>
        </div>

        {/* Login instruction description */}
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          {role === 'admin' 
            ? "Accès technique réservé aux administrateurs de la société pour gérer les clients et suivre le parc de routeurs." 
            : "Espace privé dédié à votre enseigne. Personnalisez votre portail avec l'IA et suivez la fréquentation de votre réseau."
          }
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Admin Inputs */}
          {role === 'admin' && (
            <div className="space-y-4">
              <div>
                <label className="form-label">Identifiant Administrateur</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Mot de passe</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="form-input pr-10"
                  />
                  <Lock size={14} className="absolute right-3.5 top-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          )}

          {/* Client Inputs */}
          {role === 'client' && (
            <div className="space-y-4">
              <div>
                <label className="form-label">Sélectionnez votre Enseigne</label>
                {loadingClients ? (
                  <div className="form-input text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                    Chargement des enseignes enregistrées...
                  </div>
                ) : clients.length === 0 ? (
                  <div className="form-input text-xs text-red-400 border-red-500/25 bg-red-500/5">
                    Aucun client enregistré dans la base de données. Créez-en un dans la partie admin.
                  </div>
                ) : (
                  <select
                    value={selectedClientSlug}
                    onChange={(e) => setSelectedClientSlug(e.target.value)}
                    className="form-input bg-[#090e1a] text-sm"
                  >
                    {clients.map(c => (
                      <option key={c._id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="form-label">Mot de passe Espace Client</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Par défaut: client123"
                    value={clientPass}
                    onChange={(e) => setClientPass(e.target.value)}
                    className="form-input pr-10"
                  />
                  <Lock size={14} className="absolute right-3.5 top-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {loginError && (
            <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex gap-2 items-center">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loggingIn || (role === 'client' && clients.length === 0)}
            className="btn-primary w-full py-3.5 justify-center mt-2 font-bold"
          >
            {loggingIn ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Vérification des identifiants...
              </>
            ) : (
              <>
                Se Connecter
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-[0.7rem] text-slate-500 space-y-1">
          <p className="font-bold text-slate-400 uppercase tracking-wider text-[0.6rem] mb-1">🔑 Informations de Démo :</p>
          <p>• <b>Admin</b> : identifiant <code className="text-purple-400">admin</code> et mot de passe <code className="text-purple-400">admin</code></p>
          <p>• <b>Client</b> : sélectionnez l'enseigne et utilisez le mot de passe <code className="text-purple-400">client123</code></p>
        </div>
        {/* Register + footer links */}
        <div className="pt-2 border-t border-white/5 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline">
              Créer un espace client
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-[0.65rem] text-slate-600 text-center">
        Treetronix SaaS • Portails Wi-Fi captifs pour GlobalNet
      </p>
    </main>
  );
}
