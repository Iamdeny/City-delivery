/**
 * GET заказа по ID — прокси к backend GET /api/orders/:id
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}/${id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'Заказ не найден' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logger.error('[API Orders GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка получения заказа' },
      { status: 500 }
    );
  }
}
