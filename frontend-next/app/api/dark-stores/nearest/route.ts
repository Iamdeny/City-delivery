import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'INVALID_COORDS', message: 'lat/lng required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/api/dark-stores/nearest?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
      cache: 'no-store',
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { success: false, error: raw || `Backend error: ${res.status}` };
    }

    return NextResponse.json(data ?? { success: false }, { status: res.status });
  } catch (error) {
    logger.error('[API Dark Stores Nearest] Error:', error);
    return NextResponse.json(
      { success: false, error: 'BACKEND_UNAVAILABLE', message: 'Backend недоступен.' },
      { status: 503 }
    );
  }
}

