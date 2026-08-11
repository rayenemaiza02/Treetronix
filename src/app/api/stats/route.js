import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/stats - Dashboard metrics
export async function GET() {
  try {
    const db = await getDb();

    const clients = await db.clients.find({});
    const portals = await db.portals.find({});
    const connectionstats = await db.connectionstats.find({});
    const histories = await db.portalhistories.find({});

    const totalClients = clients.length;
    const activePortals = portals.filter(p => p.isActive).length;
    const draftPortals = portals.filter(p => !p.isActive).length;
    const totalConnections = connectionstats.length;
    const successfulConnections = connectionstats.filter(s => s.status === 'success').length;

    // Recent activity (last 10 history entries)
    const recentActivity = histories
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
      .slice(0, 10)
      .map(h => ({
        id: h._id,
        description: h.description,
        modifiedBy: h.modifiedBy,
        modifiedAt: h.modifiedAt,
        portalId: h.portalId,
      }));

    // Connections per day (last 7 days)
    const now = new Date();
    const connectionsPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const count = connectionstats.filter(s => 
        s.timestamp && s.timestamp.toString().startsWith(dayStr)
      ).length;
      connectionsPerDay.push({
        date: dayStr,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        connections: count,
      });
    }

    // Auth type distribution
    const authTypes = {};
    connectionstats.forEach(s => {
      authTypes[s.authTypeUsed] = (authTypes[s.authTypeUsed] || 0) + 1;
    });

    // Per-portal connection counts
    const portalStats = portals.map(p => {
      const count = connectionstats.filter(s => s.portalId === p._id || s.portalId === String(p._id)).length;
      const client = clients.find(c => c._id === p.clientId || String(c._id) === String(p.clientId));
      return {
        portalId: p._id,
        portalName: p.name,
        clientName: client?.name || 'Inconnu',
        connections: count,
      };
    }).sort((a, b) => b.connections - a.connections);

    return NextResponse.json({
      success: true,
      data: {
        totalClients,
        activePortals,
        draftPortals,
        totalConnections,
        successfulConnections,
        recentActivity,
        connectionsPerDay,
        authTypes,
        portalStats,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
