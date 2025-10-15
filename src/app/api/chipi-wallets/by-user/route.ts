import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const externalUserId = url.searchParams.get('externalUserId');
  if (!externalUserId) return NextResponse.json({ error: 'externalUserId required' }, { status: 400 });

  const { sessionId } = getAuth(request);
  if (!sessionId) return NextResponse.json({ error: 'Clerk session not found' }, { status: 401 });

  const CHIPI_BASE = process.env.CHIPI_BASE_URL || 'https://celebrated-vision-production-66a5.up.railway.app';
  const CHIPI_KEY = process.env.CHIPI_API_KEY || process.env.CHIPI_SECRET_KEY;
  if (!CHIPI_KEY) return NextResponse.json({ error: 'Chipi API key not configured' }, { status: 500 });

  try {
    const walletRes = await fetch(`${CHIPI_BASE}/v1/chipi-wallets/by-user?externalUserId=${encodeURIComponent(externalUserId)}`, {
      headers: {
        Authorization: `Bearer ${CHIPI_KEY}`,
        'Content-Type': 'application/json',
        'X-Clerk-Session-Id': sessionId,
      },
    });
    const walletData = await walletRes.json();

    if (!walletRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: walletRes.status });
    }

    const balanceRes = await fetch(`${CHIPI_BASE}/v1/chipi-wallets/${walletData.id}/balance`, {
      headers: {
        Authorization: `Bearer ${CHIPI_KEY}`,
        'Content-Type': 'application/json',
        'X-Clerk-Session-Id': sessionId,
      },
    });
    const balanceData = await balanceRes.json();

    if (!balanceRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: balanceRes.status });
    }

    return NextResponse.json({ ...walletData, balance: balanceData.balance }, { status: 200 });
  } catch (err) {
    console.error('Chipi proxy error', err);
    return NextResponse.json({ error: 'proxy error' }, { status: 502 });
  }
}
