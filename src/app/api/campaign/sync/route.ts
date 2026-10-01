import { NextResponse } from 'next/server';
import { syncFromLeadRadar, importLeadsFromObjects } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { leads } = body;

    if (Array.isArray(leads) && leads.length > 0) {
      const res = importLeadsFromObjects(leads);
      return NextResponse.json({
        success: true,
        message: `Imported ${res.added} new leads. Total database: ${res.total}`,
        ...res,
      });
    }

    // Auto-sync from LeadRadar directory
    const res = syncFromLeadRadar();
    return NextResponse.json({
      success: true,
      message: `Synchronized with LeadRadar. Added ${res.added} leads. Total in queue: ${res.total}`,
      ...res,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
