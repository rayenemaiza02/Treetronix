import { NextResponse } from 'next/server';
import { handleAiAction } from '@/lib/aiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai — Routeur d'Actions IA
 *
 * Actions supportées:
 *  - "modify"    : Modification / personnalisation ciblée d'un portail (instructions, currentConfig)
 *  - "generate"  : Génération automatique d'un portail complet par secteur (sector, clientName)
 *  - "recommend" : Diagnostic & recommandations ergonomiques/RGPD (currentConfig)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action requise. Actions disponibles: "modify", "generate", "recommend".'
      }, { status: 400 });
    }

    // Exécution de l'action via le routeur IA central
    const result = await handleAiAction(action, payload);
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error(`[Routeur IA] Erreur lors de l'exécution de l'action:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors du traitement de l\'action IA.'
    }, { status: 500 });
  }
}
