import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PUT /api/portals/[id]/history/[historyId]/restore
export async function PUT(request, { params }) {
  try {
    const { id, historyId } = params;
    const db = await getDb();

    // 1. Find target portal by portalId or clientId
    let portal = await db.portals.findById(id);
    if (!portal) {
      portal = await db.portals.findOne({ clientId: id });
    }

    if (!portal) {
      return NextResponse.json({ success: false, error: 'Portail non trouvé.' }, { status: 404 });
    }

    const targetPortalId = portal._id || portal.id;

    // 2. Find target history entry
    const historyList = await db.portalhistories.find({ portalId: targetPortalId });
    let targetHistory = historyList.find(
      h => String(h._id) === String(historyId) ||
           String(h.id) === String(historyId) ||
           String(h.version) === String(historyId)
    );

    if (!targetHistory && db.portalhistories.findById) {
      try {
        targetHistory = await db.portalhistories.findById(historyId);
      } catch (err) {
        // Ignore fallback search error
      }
    }

    if (!targetHistory) {
      return NextResponse.json({ success: false, error: 'Version introuvable' }, { status: 404 });
    }

    const targetVersionNumber = targetHistory.version || 1;
    const currentVersionNumber = portal.version || 1;

    // 3. Save current state before restoring
    await db.portalhistories.create({
      portalId: targetPortalId,
      version: currentVersionNumber,
      config: { ...portal },
      modifiedBy: 'Admin',
      description: `Sauvegarde automatique avant restauration vers version ${targetVersionNumber}`,
      modifiedAt: new Date().toISOString()
    });

    // 4. Clean config object (exclude metadata/IDs so we don't overwrite primary keys)
    const rawConfig = targetHistory.config || {};
    const {
      _id,
      id: rawId,
      clientId,
      client_id,
      createdAt,
      created_at,
      updatedAt,
      updated_at,
      version: rawVer,
      ...cleanConfig
    } = rawConfig;

    // 5. Update portal with target config and increment version
    const newVersion = currentVersionNumber + 1;
    const updatedPortal = await db.portals.findByIdAndUpdate(targetPortalId, {
      ...cleanConfig,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });

    const finalPortal = updatedPortal || {
      ...portal,
      ...cleanConfig,
      version: newVersion,
      updatedAt: new Date().toISOString()
    };

    // 6. Log the restore event itself
    await db.portalhistories.create({
      portalId: targetPortalId,
      version: newVersion,
      config: { ...finalPortal },
      modifiedBy: 'Admin',
      description: `Restauration vers la version ${targetVersionNumber}`,
      modifiedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      portal: finalPortal,
      data: finalPortal
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
