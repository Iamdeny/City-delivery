/**
 * API Route для продуктов
 * Фаза 8: Замена временных сервисов на API Routes
 * Проксирует запросы к backend API
 */
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const darkStoreId = searchParams.get('dark_store_id');
    const category = searchParams.get('category');
    
    // Формируем URL для backend API
    const backendUrl = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`);
    
    logger.debug('[API Products] Connecting to:', backendUrl.toString());
    if (darkStoreId) {
      backendUrl.searchParams.set('dark_store_id', darkStoreId);
    }
    if (category) {
      backendUrl.searchParams.set('category', category);
    }

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Передаем таймаут через AbortController (совместимость с Node.js)
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 секунд
        return controller.signal;
      })()
    });

    if (!response.ok) {
      // Для 503 (Service Unavailable) возвращаем специальный код
      if (response.status === 503) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend недоступен. Проверьте, что сервер запущен на порту 5000.',
            code: 'BACKEND_UNAVAILABLE'
          },
          { status: 503 }
        );
      }
      
      const errorText = await response.text();
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status} ${response.statusText}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Возвращаем данные в формате, ожидаемом фронтендом
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    logger.error('[API Products] Error:', error);
    
    // Если это ошибка таймаута или подключения, возвращаем 503
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const errorCode = (error as any).code;
      
      // Проверяем различные типы ошибок подключения
      if (
        error.name === 'TimeoutError' || 
        error.name === 'AbortError' ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('eacces') ||
        errorMessage.includes('permission denied') ||
        errorCode === 'EACCES' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ENOTFOUND' ||
        (error as any).cause?.code === 'EACCES'
      ) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend недоступен. Проверьте, что сервер запущен на порту 5000.',
            code: 'BACKEND_UNAVAILABLE',
            details: process.env.NODE_ENV === 'development' 
              ? `Попытка подключения к: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`
              : undefined
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
