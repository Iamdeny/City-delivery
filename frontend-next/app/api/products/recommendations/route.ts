/**
 * Прокси рекомендаций для корзины (Советуем)
 * GET /api/products/recommendations?exclude=1,2,3&limit=6
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exclude = searchParams.get('exclude') ?? '';
    const limit = searchParams.get('limit') ?? '6';

    const backendUrl = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}/recommendations`);
    if (exclude) backendUrl.searchParams.set('exclude', exclude);
    backendUrl.searchParams.set('limit', limit);

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ success: true, products: [], count: 0 }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data ?? { success: true, products: [], count: 0 }, {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch {
    return NextResponse.json({ success: true, products: [], count: 0 }, { status: 200 });
  }
}
