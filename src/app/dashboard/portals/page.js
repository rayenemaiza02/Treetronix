'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wifi, Edit3, Eye, Search, Layers } from 'lucide-react';

export default function PortalsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await fetch('/api/clients', { cache: 'no-store' });
        const clientsData = await clientsRes.json();

        if (clientsData.success) {
          const fetchedData = [];
          for (const client of clientsData.data) {
            // Find portal config
            const portalRes = await fetch(`/api/portals/${client._id}`, { cache: 'no-store' });
            const portalData = await portalRes.json();
            if (portalData.success && portalData.data) {
              fetchedData.push({
                client,
                portal: portalData.data,
              });
            }
          }
          setData(fetchedData);
        }
      } catch (error) {
        console.error('Error fetching portals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = data.filter(item => 
    item.client.name.toLowerCase().includes(search.toLowerCase()) ||
    item.portal.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Wifi size={20} className="text-purple-400" />
          Portails Captifs
        </h2>
        <p className="text-xs text-slate-400">Accédez aux studios de configuration de chaque portail captif client.</p>
      </div>

      {/* Search */}
      <div className="glass p-4 rounded-xl flex items-center gap-3 border border-white/5 max-w-md">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Rechercher un portail..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-200 outline-none w-full placeholder-slate-500"
        />
      </div>

      {/* Grids */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <div className="spinner" />
          <p className="text-xs text-slate-400">Chargement des portails...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-xs">Aucun portail trouvé. Allez dans l'onglet "Clients" pour en créer un.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(({ client, portal }) => (
            <div key={portal._id} className="kpi-card glass flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-purple">{client.name}</span>
                  <span className={`badge ${portal.isActive ? 'badge-success' : 'badge-muted'} text-[0.65rem] font-bold`}>
                    {portal.isActive ? 'En ligne' : 'Brouillon'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{portal.name || 'Sans titre'}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  "{portal.welcomeText}"
                </p>

                <div className="flex gap-2 flex-wrap mt-3">
                  <span className="text-[0.7rem] bg-white/5 border border-white/5 text-slate-300 py-0.5 px-2 rounded-full capitalize font-medium">
                    Auth: {portal.authType === 'button' ? 'Simple clic' : portal.authType}
                  </span>
                  <span className="text-[0.7rem] bg-white/5 border border-white/5 text-slate-300 py-0.5 px-2 rounded-full capitalize font-medium">
                    Template: {portal.templateName}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                <Link href={`/client/${client.slug}?admin=true`} className="flex-1 text-decoration-none">
                  <button className="btn-primary w-full py-1.5 justify-center text-xs">
                    <Edit3 size={12} />
                    Assister
                  </button>
                </Link>
                <a href={`/portal/${client.slug}`} target="_blank" rel="noopener noreferrer">
                  <button className="btn-secondary py-1.5 px-3 text-xs" title="Prévisualiser la page réelle">
                    <Eye size={12} />
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
