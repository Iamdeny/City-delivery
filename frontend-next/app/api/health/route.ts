/**
 * API Route для проверки здоровья сервера
 * Используется useConnectionStatus для проверки соединения
 */
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';

export async function GET() {
  try {
    // Проверяем соединение с backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    } else {
      // Backend вернул ошибку, но это не критично для health check
      return NextResponse.json(
        { status: 'error', message: 'Backend недоступен', code: 'BACKEND_UNAVAILABLE' },
        { status: 503 }
      );
    }
  } catch (error) {
    // Ошибка сети или таймаут - это нормально, если backend не запущен
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = 
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('EACCES') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('timeout');

    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Backend недоступен',
        code: 'BACKEND_UNAVAILABLE',
        details: isConnectionError ? 'Connection error' : errorMessage
      },
      { status: 503 }
    );
  }
}
