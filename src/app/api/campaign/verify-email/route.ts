import { NextResponse } from 'next/server';
import { verifyEmailDeliverability } from '@/lib/verifier';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmailDeliverability(email);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Verification error' },
      { status: 500 }
    );
  }
}
