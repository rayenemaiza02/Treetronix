import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/portal/[slug] - Public API for GlobalNet hardware
// Returns active portal config for a client by slug
export async function GET(request, { params }) {
  try {
    const db = await getDb();

    // Find client by slug
    let client = await db.clients.findOne({ slug: params.slug });
    if (!client) {
      // Fallback: search for a client whose slug contains or starts with the requested slug
      const allClients = await db.clients.find({});
      client = allClients.find(c => 
        c.slug.startsWith(params.slug) || 
        params.slug.startsWith(c.slug) ||
        c.slug.includes(params.slug)
      );
    }
    if (!client) {
      return NextResponse.json({ 
        success: false, 
        error: `Aucun portail trouvé pour le slug: ${params.slug}` 
      }, { status: 404 });
    }

    // Find active portal for this client
    const portal = await db.portals.findOne({ clientId: client._id, isActive: true })
      || await db.portals.findOne({ clientId: client._id });

    if (!portal) {
      return NextResponse.json({ 
        success: false, 
        error: 'Aucun portail actif pour ce client.' 
      }, { status: 404 });
    }

    // Return a GlobalNet-compatible config object
    const config = {
      client: client.name,
      slug: client.slug,
      portalId: portal._id,
      logo: portal.logoUrl || null,
      primaryColor: portal.primaryColor,
      backgroundColor: portal.backgroundColor,
      textColor: portal.textColor,
      backgroundImage: portal.backgroundImageUrl || null,
      welcomeText: portal.welcomeText,
      buttonText: portal.buttonText,
      authType: portal.authType,
      templateName: portal.templateName,
      termsOfUse: portal.termsOfUse,
      promoBanner: portal.promoBannerUrl || null,
      version: portal.version,
      updatedAt: portal.updatedAt,
      portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/portal/${params.slug}`,
    };

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/portal/[slug] - Log a connection event from the portal
export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { authTypeUsed = 'button', status = 'success' } = body;

    const db = await getDb();
    let client = await db.clients.findOne({ slug: params.slug });
    if (!client) {
      // Fallback: search for a client whose slug contains or starts with the requested slug
      const allClients = await db.clients.find({});
      client = allClients.find(c => 
        c.slug.startsWith(params.slug) || 
        params.slug.startsWith(c.slug) ||
        c.slug.includes(params.slug)
      );
    }
    if (!client) return NextResponse.json({ success: false, error: 'Client non trouvé.' }, { status: 404 });

    const portal = await db.portals.findOne({ clientId: client._id, isActive: true });
    if (!portal) return NextResponse.json({ success: false, error: 'Portail non trouvé.' }, { status: 404 });

    const stat = await db.connectionstats.create({
      portalId: portal._id,
      authTypeUsed,
      status,
    });

    return NextResponse.json({ success: true, data: stat }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
