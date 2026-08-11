import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/clients - List all clients
export async function GET() {
  try {
    const db = await getDb();
    const clients = await db.clients.find({});
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, sector, email, password } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Le nom du client est requis.' }, { status: 400 });
    }

    const db = await getDb();

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const existing = await db.clients.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Un client avec ce nom existe déjà.' }, { status: 409 });
    }

    const client = await db.clients.create({ 
      name, slug, 
      sector: sector || 'other',
      email: email || '',
      password: password || 'client123',
    });

    // Auto-create a default portal for the client
    const portal = await db.portals.create({
      clientId: client._id,
      name: `Portail ${name}`,
      welcomeText: `Bienvenue chez ${name} ! Connectez-vous à notre Wi-Fi.`,
    });

    // Save initial version in history
    await db.portalhistories.create({
      portalId: portal._id,
      version: 1,
      config: { ...portal },
      modifiedBy: 'Système',
      description: 'Création initiale du portail',
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients - Delete a client by id (via query param)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

    const db = await getDb();

    // Also delete related portals and history
    const portals = await db.portals.find({ clientId: id });
    for (const portal of portals) {
      await db.portalhistories.deleteMany({ portalId: portal._id });
      await db.connectionstats.deleteMany({ portalId: portal._id });
    }
    await db.portals.deleteOne({ clientId: id });
    await db.clients.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
