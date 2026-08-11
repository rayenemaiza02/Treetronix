import { NextResponse } from 'next/server';
import { modifyPortal, generatePortal, recommendPortalImprovements } from '@/lib/aiService';

// POST /api/ai - AI portal modification, generation, and recommendations
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, instructions, currentConfig, sector, clientName } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action requise: modify | generate | recommend' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'modify':
        if (!instructions) return NextResponse.json({ success: false, error: 'Instructions requises.' }, { status: 400 });
        result = await modifyPortal(instructions, currentConfig || {});
        break;

      case 'generate':
        result = await generatePortal(sector || 'default', clientName || 'Client');
        break;

      case 'recommend':
        if (!currentConfig) return NextResponse.json({ success: false, error: 'Configuration requise pour les recommandations.' }, { status: 400 });
        result = { suggestions: recommendPortalImprovements(currentConfig), method: 'local-analysis' };
        break;

      default:
        return NextResponse.json({ success: false, error: `Action inconnue: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
