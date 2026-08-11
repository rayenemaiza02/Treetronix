'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('treetronix_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.role === 'admin') {
          router.push('/dashboard');
          return;
        } else if (session.role === 'client' && session.slug) {
          router.push(`/client/${session.slug}`);
          return;
        }
      } catch (e) {}
    }
    // No session found, redirect to login
    router.push('/login');
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#060918] gap-6">
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Brand */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-purple-400/20 animate-pulse">
          <Radio size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Treetronix SaaS</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Portails Wi-Fi Intelligents • Alimenté par Gemini AI</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Loader2 size={16} className="animate-spin text-purple-400" />
        Initialisation de la session...
      </div>
    </main>
  );
}
