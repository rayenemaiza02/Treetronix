import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePortalAnalytics } from '@/lib/analyticsEngine';

export const dynamic = 'force-dynamic';

// GET /api/stats - Dashboard metrics powered by deterministic Analytics Engine
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const portalId = searchParams.get('portalId');

    const db = await getDb();

    const clients = await db.clients.find({});
    const portals = await db.portals.find({});
    const connectionstats = await db.connectionstats.find({});
    const histories = await db.portalhistories.find({});

    // Filter connection stats if specific portalId requested
    const filteredStats = portalId 
      ? connectionstats.filter(s => String(s.portalId) === String(portalId))
      : connectionstats;

    // Deterministic analytics calculation
    const analytics = calculatePortalAnalytics(filteredStats);

    const totalClients = clients.length;
    const activePortals = portals.filter(p => p.isActive).length;
    const draftPortals = portals.filter(p => !p.isActive).length;

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

    // Per-portal connection counts
    const portalStats = portals.map(p => {
      const count = connectionstats.filter(s => String(s.portalId) === String(p._id)).length;
      const client = clients.find(c => String(c._id) === String(p.clientId));
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
        totalConnections: analytics.totalConnections,
        successfulConnections: analytics.successfulConnections,
        recentActivity,
        connectionsPerDay: analytics.connectionsPerDay,
        authTypes: analytics.authBreakdown.reduce((acc, curr) => {
          acc[curr.type] = curr.count;
          return acc;
        }, {}),
        portalStats,
        analytics, // Full deterministic metrics bundle
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/stats - Simulate Wi-Fi traffic connections for presentation & testing
export async function POST(request) {
  try {
    const { portalId, count = 30 } = await request.json();
    if (!portalId) {
      return NextResponse.json({ success: false, error: 'portalId est requis.' }, { status: 400 });
    }

    const db = await getDb();
    const authTypes = ['button', 'email', 'phone', 'login', 'voucher'];
    const now = new Date();
    const generatedStats = [];

    for (let i = 0; i < count; i++) {
      // Random day in last 7 days
      const daysAgo = Math.floor(Math.random() * 7);
      // Hour bias around peak time (17h-21h)
      let hour = Math.floor(Math.random() * 24);
      if (Math.random() > 0.35) {
        hour = 17 + Math.floor(Math.random() * 4);
      }
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      timestamp.setHours(hour, minute, 0, 0);

      // Auth type bias (email & phone common)
      const authTypeUsed = authTypes[Math.floor(Math.random() * authTypes.length)];
      // Status bias (88% success, 12% failed)
      const status = Math.random() > 0.12 ? 'success' : 'failed';

      const statDoc = {
        portalId: String(portalId),
        authTypeUsed,
        status,
        timestamp: timestamp.toISOString(),
      };

      const created = await db.connectionstats.create(statDoc);
      generatedStats.push(created);
    }

    return NextResponse.json({
      success: true,
      message: `${generatedStats.length} connexions simulées générées dans Supabase avec succès !`,
      count: generatedStats.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
