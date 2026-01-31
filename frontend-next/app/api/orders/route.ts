/**
 * API Route для заказов
 * Фаза 8: Замена временных сервисов на API Routes
 * Проксирует запросы к backend API
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Получаем токен из заголовков
    const authHeader = request.headers.get('authorization');
    
    // Формируем заголовки для backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 30000); // 30 секунд
        return controller.signal;
      })()
    });

    const data = await response.json();

    if (!response.ok) {
      // Preserve backend error code (data.error) and provide user-facing message (data.message).
      const errorCode: string = String(data?.error || `HTTP_${response.status}`);
      let message: string = String(data?.message || data?.error || `Backend error: ${response.status}`);
      
      if (response.status === 401) {
        if (message.includes('Токен не предоставлен')) {
          message = 'Для оформления заказа необходимо войти в систему';
        } else if (message.includes('Токен истек') || message.includes('TokenExpiredError')) {
          message = 'Токен истек'; // handled in orderService (refresh)
        } else if (message.includes('Невалидный токен')) {
          message = 'Сессия истекла. Пожалуйста, войдите в систему снова';
        }
      }
      if (response.status === 403) {
        // Usually happens when logged in as ops role (admin/manager) trying to place a customer order
        message = 'Недостаточно прав для оформления заказа (нужна роль customer).';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorCode,
          message,
          details: data?.details ?? null,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logger.error('[API Orders] Error:', error);
    
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
