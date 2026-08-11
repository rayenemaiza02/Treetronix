'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Plus, Trash2, Edit3, ExternalLink, 
  Search, ShieldAlert, Sparkles, Building2, Store, Coffee, Hotel
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Add Client Form state
  const [name, setName] = useState('');
  const [sector, setSector] = useState('boutique');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
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
    fetchClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Le nom du client est requis.');
      return;
    }
    setFormError('');
    setAdding(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), sector }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        showToast('Client et portail créés avec succès !', 'success');
        fetchClients();
      } else {
        setFormError(data.error);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteClient = async (id, name) => {
    if (!confirm(`Voulez-vous vraiment supprimer ${name} ? Cela supprimera également son portail captif, l'historique et ses statistiques.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Client supprimé avec succès.', 'info');
        fetchClients();
      } else {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase())
  );

  const getSectorIcon = (sec) => {
    switch (sec.toLowerCase()) {
      case 'hotel': return <Hotel size={16} className="text-amber-400" />;
      case 'cafe':
      case 'café': return <Coffee size={16} className="text-orange-400" />;
      case 'restaurant': return <Store size={16} className="text-rose-400" />;
      case 'supermarché':
      case 'supermarche': return <Building2 size={16} className="text-blue-400" />;
      default: return <Store size={16} className="text-purple-400" />;
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

      {/* Intro section */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Users size={20} className="text-purple-400" />
          Portefeuille Clients
        </h2>
        <p className="text-xs text-slate-400">Configurez vos clients de portail captif : Carrefour, Traaji Store, boutiques, cafés, hôtels.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left/Middle: Client List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="glass p-4 rounded-xl flex items-center gap-3 border border-white/5">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un client ou un secteur..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-200 outline-none w-full placeholder-slate-500"
            />
          </div>

          {/* Client Table */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 space-y-3">
                <div className="spinner"></div>
                <p className="text-xs text-slate-400">Récupération des clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Users size={32} className="mx-auto text-slate-600" />
                <p className="text-xs">Aucun client ne correspond à votre recherche.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom du Client</th>
                    <th>Secteur</th>
                    <th>Slug de Redirection</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client._id}>
                      <td className="font-bold text-slate-200">{client.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getSectorIcon(client.sector)}
                          <span className="text-xs text-slate-300 capitalize">{client.sector}</span>
                        </div>
                      </td>
                      <td>
                        <code className="text-xs text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10">
                          {client.slug}
                        </code>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <Link href={`/client/${client.slug}?admin=true`}>
                            <button className="btn-secondary py-1 px-3 text-xs flex items-center gap-1 hover:border-purple-500/50 hover:text-purple-300">
                              <Edit3 size={12} />
                              Assistance Client
                            </button>
                          </Link>
                          <a href={`/portal/${client.slug}`} target="_blank" rel="noopener noreferrer">
                            <button className="btn-secondary py-1 px-2 text-xs" title="Voir la démo publique">
                              <ExternalLink size={12} />
                            </button>
                          </a>
                          <button 
                            onClick={() => handleDeleteClient(client._id, client.name)}
                            className="btn-danger flex items-center justify-center p-1 px-2"
                            title="Supprimer le client"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Add Client Form */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Nouveau Client
            </h3>
          </div>

          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <label className="form-label">Nom de la société / Client</label>
              <input
                type="text"
                placeholder="Ex: Carrefour, Traaji Store"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Secteur d'activité</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="form-input bg-[#090e1a]"
              >
                <option value="hotel">Hôtel / Hébergement</option>
                <option value="cafe">Café / Salon de thé</option>
                <option value="restaurant">Restaurant / Fast-food</option>
                <option value="supermarche">Supermarché / Grande surface</option>
                <option value="boutique">Boutique de vêtements / Mode</option>
                <option value="other">Autre commerce</option>
              </select>
            </div>

            {formError && (
              <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 flex gap-2 items-center">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={adding}
              className="btn-primary w-full py-2.5 justify-center mt-2"
            >
              {adding ? (
                <>
                  <div className="spinner !w-4 !height-4"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Créer le Client & Portail
                </>
              )}
            </button>
          </form>

          <div className="border-t border-white/5 pt-4 text-[0.72rem] text-slate-400 space-y-2 leading-relaxed">
            <p className="font-semibold text-purple-300">💡 Conseil d'encadrement :</p>
            <p>La création d'un client génère automatiquement un portail par défaut dans la base de données. L'IA configure préventivement le portail selon le secteur d'activité choisi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
