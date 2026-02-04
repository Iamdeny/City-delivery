/**
 * Клиент API корзины на бэкенде
 * Вызывается только при наличии access token (авторизованный пользователь)
 */
'use client';

import { API_CONFIG, STORAGE_KEYS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/types';

const CART_BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CART}`;

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${STORAGE_KEYS.PREFIX}access_token`);
}

/** Элемент корзины в ответе бэкенда (smartCartService) */
interface BackendCartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal?: number;
  image?: string | null;
  darkStoreId?: number | null;
  addedAt?: string;
}

/** Ответ GET /api/cart (smartCartService.getCart) */
interface BackendCartResponse {
  success: boolean;
  cart?: {
    items?: BackendCartItem[];
    total?: number;
    updatedAt?: string;
  };
  error?: string;
}

function mapBackendItemToCartItem(item: BackendCartItem): CartItem {
  return {
    id: item.productId,
    name: item.name,
    price: Number(item.price),
    category: '', // бэкенд в корзине не отдаёт category
    image: item.image ?? '',
    inStock: true,
    quantity: Math.max(1, Math.min(99, item.quantity)),
  };
}

/**
 * Получить корзину с сервера (только для авторизованных)
 */
export async function fetchCartFromServer(): Promise<CartItem[]> {
  const token = getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(CART_BASE, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) return [];
      logger.warn('Cart API error:', res.status, await res.text());
      return [];
    }

    const data: BackendCartResponse = await res.json();
    if (!data.success || !data.cart?.items?.length) return [];

    return data.cart.items.map(mapBackendItemToCartItem);
  } catch (e) {
    logger.error('fetchCartFromServer error', e);
    return [];
  }
}

/**
 * Добавить товар в корзину на сервере
 * Возвращает обновлённый список items или null при ошибке
 */
export async function addCartItemOnServer(
  productId: number,
  quantity: number = 1,
  darkStoreId?: number
): Promise<CartItem[] | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${CART_BASE}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, quantity, darkStoreId: darkStoreId ?? undefined }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.warn('addCartItemOnServer error', res.status, text);
      return null;
    }

    const data: BackendCartResponse = await res.json();
    if (!data.success || !data.cart?.items?.length) return null;

    return data.cart.items.map(mapBackendItemToCartItem);
  } catch (e) {
    logger.error('addCartItemOnServer error', e);
    return null;
  }
}

/**
 * Обновить количество товара на сервере
 */
export async function updateCartItemOnServer(
  productId: number,
  quantity: number
): Promise<CartItem[] | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${CART_BASE}/items/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });

    if (!res.ok) {
      logger.warn('updateCartItemOnServer error', res.status, await res.text());
      return null;
    }

    const data: BackendCartResponse = await res.json();
    if (!data.success) return null;
    if (!data.cart?.items?.length) return [];

    return data.cart.items.map(mapBackendItemToCartItem);
  } catch (e) {
    logger.error('updateCartItemOnServer error', e);
    return null;
  }
}

/**
 * Удалить товар из корзины на сервере
 */
export async function removeCartItemOnServer(productId: number): Promise<CartItem[] | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${CART_BASE}/items/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      logger.warn('removeCartItemOnServer error', res.status, await res.text());
      return null;
    }

    const data: BackendCartResponse = await res.json();
    if (!data.success) return null;
    return (data.cart?.items ?? []).map(mapBackendItemToCartItem);
  } catch (e) {
    logger.error('removeCartItemOnServer error', e);
    return null;
  }
}

/**
 * Очистить корзину на сервере
 */
export async function clearCartOnServer(): Promise<CartItem[] | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(CART_BASE, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      logger.warn('clearCartOnServer error', res.status, await res.text());
      return null;
    }

    const data: BackendCartResponse = await res.json();
    if (!data.success) return null;
    return [];
  } catch (e) {
    logger.error('clearCartOnServer error', e);
    return null;
  }
}

/** Есть ли токен (пользователь авторизован) */
export function hasCartApiToken(): boolean {
  return !!getAccessToken();
}
