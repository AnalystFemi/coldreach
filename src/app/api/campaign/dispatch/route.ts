import { NextResponse } from 'next/server';
import { dispatchSingleLead, dispatchNextEligibleLead } from '@/lib/scheduler';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { leadId } = body;

    if (leadId) {
      const res = await dispatchSingleLead(leadId);
      return NextResponse.json(res);
    }

    const res = await dispatchNextEligibleLead();
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Dispatch error' },
      { status: 500 }
    );
  }
}
