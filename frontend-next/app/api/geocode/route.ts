import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

type NominatimItem = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limitRaw = url.searchParams.get('limit') || '5';
    const limit = Math.max(1, Math.min(10, Number(limitRaw) || 5));

    if (!q) {
      return NextResponse.json({ success: false, error: 'QUERY_REQUIRED' }, { status: 400 });
    }

    // OpenStreetMap Nominatim (no key). Requires a valid User-Agent.
    const upstream = new URL('https://nominatim.openstreetmap.org/search');
    upstream.searchParams.set('format', 'jsonv2');
    upstream.searchParams.set('limit', String(limit));
    upstream.searchParams.set('addressdetails', '1');
    upstream.searchParams.set('q', q);

    const res = await fetch(upstream.toString(), {
      headers: {
        // Nominatim usage policy requires identifying UA string
        'User-Agent': 'city-delivery-dev/1.0 (frontend-next)',
        Accept: 'application/json',
      },
      // avoid caching user-specific queries
      cache: 'no-store',
    });

    const raw = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'GEOCODE_FAILED', message: `Geocoding failed (${res.status})`, details: raw.slice(0, 500) },
        { status: 502 }
      );
    }

    let data: unknown = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    const items = Array.isArray(data) ? (data as NominatimItem[]) : [];
    const results = items
      .map((x) => ({
        id: x.place_id,
        label: x.display_name,
        lat: Number(x.lat),
        lng: Number(x.lon),
      }))
      .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    logger.error('[API Geocode] Error:', error);
    return NextResponse.json(
      { success: false, error: 'GEOCODE_UNAVAILABLE', message: 'Geocoding service unavailable' },
      { status: 503 }
    );
  }
}

