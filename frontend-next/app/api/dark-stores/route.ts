import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const qs = url.searchParams.toString();

    const res = await fetch(`${API_CONFIG.BASE_URL}/api/dark-stores${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { error: raw || `Backend error: ${res.status}` };
    }

    return NextResponse.json(data ?? { success: false }, { status: res.status });
  } catch (error) {
    logger.error('[API Dark Stores] Error:', error);
    return NextResponse.json(
      { success: false, error: 'BACKEND_UNAVAILABLE', message: 'Backend недоступен.' },
      { status: 503 }
    );
  }
}

