/**
 * API Route для обновления токена
 * Фаза 8: Замена временных сервисов на API Routes
 * Проксирует запросы к backend API
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { AUTH_COOKIE, cookieOptions } from '@/lib/authCookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken = (body as any)?.refreshToken || request.cookies.get(AUTH_COOKIE.refresh)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Refresh token не предоставлен'
        },
        { status: 400 }
      );
    }

    // Backend endpoint is /api/auth/refresh (legacy). Frontend route remains /api/auth/refresh-token.
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 секунд
        return controller.signal;
      })()
    });

    const raw = await response.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { error: raw || `Backend error: ${response.status}` };
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || `Backend error: ${response.status}`,
          ...data 
        },
        { status: response.status }
      );
    }

    const out = NextResponse.json(data, { status: 200 });
    if (data?.accessToken) out.cookies.set(AUTH_COOKIE.access, String(data.accessToken), cookieOptions());
    if (data?.refreshToken) out.cookies.set(AUTH_COOKIE.refresh, String(data.refreshToken), cookieOptions());
    return out;
  } catch (error) {
    logger.error('[API Refresh Token] Error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('fetch')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend недоступен. Проверьте, что сервер запущен на порту 5000.',
            code: 'BACKEND_UNAVAILABLE'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      },
      { status: 500 }
    );
  }
}
