'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Radio, Building2, ChevronRight, AlertCircle,
  Loader2, Lock, Mail, User, Briefcase, CheckCircle2
} from 'lucide-react';

const SECTORS = [
  { value: 'supermarche', label: '🛒 Grande Surface / Supermarché' },
  { value: 'hotel', label: '🏨 Hôtel / Hébergement' },
  { value: 'cafe', label: '☕ Café / Restaurant' },
  { value: 'boutique', label: '👗 Boutique / Vêtements' },
  { value: 'sport', label: '⚽ Sport / Loisirs' },
  { value: 'sante', label: '🏥 Santé / Clinique' },
  { value: 'education', label: '🎓 Éducation / Campus' },
  { value: 'transport', label: '✈️ Transport / Aéroport' },
  { value: 'other', label: '🏢 Autre secteur' },
];

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    sector: 'other',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.companyName.trim()) {
      setError("Le nom de l'enseigne est requis.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // Create client via existing API
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.companyName.trim(),
          sector: form.sector,
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la création du compte.");
      }

      const newClient = data.data;

      // Store session
      localStorage.setItem('treetronix_session', JSON.stringify({
        role: 'client',
        name: newClient.name,
        slug: newClient.slug,
        email: form.email,
      }));

      setStep(2); // Show success screen

      // Redirect after 2.5 seconds
      setTimeout(() => {
        router.push(`/client/${newClient.slug}`);
      }, 2500);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────
  if (step === 2) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-[#060918]">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />

        <div className="w-full max-w-sm p-8 rounded-3xl glass border border-emerald-500/20 shadow-2xl text-center space-y-5 fade-in">
          <CheckCircle2 size={52} className="text-emerald-400 mx-auto" />
          <div>
            <h2 className="text-xl font-extrabold text-white">Compte créé avec succès !</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Bienvenue sur la plateforme Treetronix.<br />
              Votre portail captif a été généré automatiquement.<br />
              Vous allez être redirigé vers votre espace...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
            <Loader2 size={14} className="animate-spin" />
            Redirection en cours...
          </div>
        </div>
      </main>
    );
  }

  // ── Registration Form ───────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-[#060918]">
      {/* Decorative Orbs */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Brand */}
      <div className="mb-7 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 border border-purple-400/20">
          <Radio size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Créer un compte Client</h1>
          <p className="text-[0.7rem] text-slate-500 font-semibold uppercase tracking-wider">Treetronix SaaS • Portails Wi-Fi Intelligents</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md p-8 rounded-3xl glass border border-white/5 shadow-2xl space-y-5">

        {/* Info banner */}
        <div className="flex gap-2.5 items-start bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl text-xs text-purple-300 leading-relaxed">
          <Building2 size={14} className="flex-shrink-0 mt-0.5 text-purple-400" />
          <span>Créez votre compte partenaire. Un portail Wi-Fi captif sera généré automatiquement pour votre enseigne.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">

          {/* Company name */}
          <div>
            <label className="form-label">Nom de l'Enseigne / Société</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ex: Carrefour Market, Hôtel Royal..."
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="form-input pl-9"
              />
              <User size={14} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="form-label">Secteur d'Activité</label>
            <div className="relative">
              <select
                value={form.sector}
                onChange={(e) => handleChange('sector', e.target.value)}
                className="form-input bg-[#090e1a] pl-9"
              >
                {SECTORS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Briefcase size={14} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Adresse Email Professionnelle</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="contact@votreenseigne.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="form-input pl-9"
              />
              <Mail size={14} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caractères"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="form-input pl-9 text-xs"
                />
                <Lock size={14} className="absolute left-3 top-3.5 text-slate-500" />
              </div>
            </div>
            <div>
              <label className="form-label">Confirmation</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Répétez"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`form-input pl-9 text-xs ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : form.confirmPassword && form.password === form.confirmPassword ? 'border-emerald-500/50' : ''}`}
                />
                <Lock size={14} className="absolute left-3 top-3.5 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Password match indicator */}
          {form.confirmPassword && (
            <p className={`text-[0.7rem] flex items-center gap-1 -mt-1 ${form.password === form.confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
              {form.password === form.confirmPassword
                ? <><CheckCircle2 size={11} /> Mots de passe identiques</>
                : <><AlertCircle size={11} /> Les mots de passe ne correspondent pas</>
              }
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex gap-2 items-center">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 justify-center mt-1 font-bold"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création du compte et du portail...
              </>
            ) : (
              <>
                Créer mon compte &amp; mon Portail Wi-Fi
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-xs text-slate-500">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-[0.65rem] text-slate-600">
        En créant un compte, vous acceptez les conditions d'utilisation de la plateforme Treetronix SaaS.
      </p>
    </main>
  );
}
