import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/portals/[id]/history - Get version history of a portal
export async function GET(request, { params }) {
  try {
    const db = await getDb();
    let targetId = params.id;
    const portal = await db.portals.findById(params.id) 
      || await db.portals.findOne({ clientId: params.id });
    
    if (portal) {
      targetId = portal._id;
    }

    const history = await db.portalhistories.find({ portalId: targetId });
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/portals/[id]/history - Restore a specific version
export async function POST(request, { params }) {
  try {
    const { version } = await request.json();
    if (!version) {
      return NextResponse.json({ success: false, error: 'Version requise.' }, { status: 400 });
    }

    const db = await getDb();
    let targetId = params.id;
    const portal = await db.portals.findById(params.id) 
      || await db.portals.findOne({ clientId: params.id });

    if (!portal) {
      return NextResponse.json({ success: false, error: 'Portail non trouvé.' }, { status: 404 });
    }
    
    targetId = portal._id;

    const history = await db.portalhistories.find({ portalId: targetId });
    const targetVersion = history.find(h => h.version === version);

    if (!targetVersion) {
      return NextResponse.json({ success: false, error: 'Version introuvable.' }, { status: 404 });
    }

    // Save current state before restoring
    await db.portalhistories.create({
      portalId: targetId,
      version: portal.version,
      config: { ...portal },
      modifiedBy: 'Admin',
      description: `Sauvegarde avant restauration vers la version ${version}`,
    });

    // Restore the old config
    const restoredConfig = { ...targetVersion.config };
    const newVersion = (portal.version || 1) + 1;
    const updated = await db.portals.findByIdAndUpdate(targetId, {
      ...restoredConfig,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
