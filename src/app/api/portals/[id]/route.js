import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/portals/[id] - Get portal config by portal ID or client ID
export async function GET(request, { params }) {
  try {
    const db = await getDb();
    let portal = await db.portals.findById(params.id);
    if (!portal) {
      // Fallback: search by clientId
      portal = await db.portals.findOne({ clientId: params.id });
    }
    if (!portal) {
      return NextResponse.json({ success: false, error: 'Portail non trouvé.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: portal });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/portals/[id] - Update portal config
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { modifiedBy = 'Admin', description = 'Modification manuelle', ...updates } = body;

    const db = await getDb();
    let existing = await db.portals.findById(params.id);
    let targetId = params.id;
    
    if (!existing) {
      // Fallback: search by clientId
      existing = await db.portals.findOne({ clientId: params.id });
      if (existing) {
        targetId = existing._id;
      }
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Portail non trouvé.' }, { status: 404 });
    }

    // Save current version to history before overwriting
    await db.portalhistories.create({
      portalId: targetId,
      version: existing.version || 1,
      config: { ...existing },
      modifiedBy,
      description,
    });

    // Increment version and update
    const newVersion = (existing.version || 1) + 1;
    const updated = await db.portals.findByIdAndUpdate(targetId, {
      ...updates,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
