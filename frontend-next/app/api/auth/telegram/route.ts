/**
 * API Route для авторизации через Telegram
 * Фаза 8: Замена временных сервисов на API Routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { AUTH_COOKIE, cookieOptions } from '@/lib/authCookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TELEGRAM_AUTH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000);
        return controller.signal;
      })(),
    });

    const data = await response.json();

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
    if ((data as any)?.accessToken) out.cookies.set(AUTH_COOKIE.access, String((data as any).accessToken), cookieOptions());
    if ((data as any)?.refreshToken) out.cookies.set(AUTH_COOKIE.refresh, String((data as any).refreshToken), cookieOptions());
    return out;
  } catch (error) {
    logger.error('[API Auth Telegram] Error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('fetch')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend недоступен.',
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
