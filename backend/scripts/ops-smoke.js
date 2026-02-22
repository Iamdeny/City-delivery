/**
 * Ops smoke-check:
 * - login as customer@test.com
 * - create an order
 * - ensure admin@test.com exists (create if missing)
 * - login as admin
 * - verify order appears in /api/admin/orders
 * - patch status with force=1
 * - get return summary + perform full return
 * - verify returned_qty_total + audit events
 *
 * Run:
 *   node scripts/ops-smoke.js
 */

const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function httpJson(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${method} ${path}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function login(email, password) {
  const data = await httpJson('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return { accessToken: data?.accessToken, user: data?.user };
}

async function ensureAdminUser() {
  const email = 'admin@test.com';
  const password = 'admin123';

  const existing = await query('SELECT id, email, role FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    // Ensure role
    if (existing.rows[0].role !== 'admin') {
      await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', existing.rows[0].id]);
    }
    return { email, password, id: existing.rows[0].id };
  }

  const hash = await bcrypt.hash(password, 10);
  const created = await query(
    `INSERT INTO users (email, password_hash, name, phone, role, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id`,
    [email, hash, 'Ops Admin', '+7 (999) 000-00-00', 'admin']
  );
  return { email, password, id: created.rows[0].id };
}

function pickFirstProduct(products) {
  const list = Array.isArray(products) ? products : [];
  const p = list.find((x) => Number(x?.id) > 0) || null;
  if (!p) throw new Error('No products returned from /api/products');
  return p;
}

async function getActiveStoreId() {
  const res = await query(`SELECT id FROM dark_stores WHERE is_active = true ORDER BY id ASC LIMIT 1`);
  const id = Number(res.rows[0]?.id || 0);
  return id > 0 ? id : null;
}

async function getStoreCoordsForSmoke(storeId) {
  // Prefer explicitly chosen store, but require coords (dark-store-first radius check needs them).
  const res = storeId
    ? await query(
        `SELECT id, name, latitude, longitude, delivery_radius
         FROM dark_stores
         WHERE id = $1 AND is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
         LIMIT 1`,
        [storeId]
      )
    : { rows: [] };

  if (res.rows[0]) return res.rows[0];

  const res2 = await query(
    `SELECT id, name, latitude, longitude, delivery_radius
     FROM dark_stores
     WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
     ORDER BY id ASC
     LIMIT 1`
  );
  return res2.rows[0] || null;
}

async function main() {
  console.log(`🔎 API_URL: ${API_URL}`);

  const health = await httpJson('/api/health');
  console.log('✅ health:', health?.status || 'ok');

  // Customer
  const customer = await login('customer@test.com', '123456');
  if (!customer.accessToken) throw new Error('Customer login failed: no accessToken');
  console.log('✅ customer login:', customer.user?.email, customer.user?.role);

  const productsResp = await httpJson('/api/products');
  const products = productsResp?.products ?? productsResp?.data?.products ?? productsResp?.items ?? productsResp;
  const activeStoreId = await getActiveStoreId();
  const productsList = Array.isArray(products) ? products : [];
  const p =
    (activeStoreId
      ? productsList.find((x) => Number(x?.dark_store_id || x?.darkStoreId || 0) === activeStoreId && Number(x?.id) > 0)
      : null) || pickFirstProduct(productsList);
  const productId = Number(p.id);
  const darkStoreId = activeStoreId || Number(p.dark_store_id || p.darkStoreId || p.store_id || p.storeId || 0) || undefined;

  const storeForCoords = await getStoreCoordsForSmoke(darkStoreId || null);
  if (!storeForCoords) {
    throw new Error('No active dark_stores with coordinates found (required for delivery zone check).');
  }
  // Pick a point very close to store (inside radius).
  const latitude = Number(storeForCoords.latitude) + 0.001;
  const longitude = Number(storeForCoords.longitude) + 0.001;

  const orderBody = {
    items: [{ productId, quantity: 1 }],
    address: 'ул. Пушкина, д. 10',
    phone: '+7 (999) 123-45-67',
    comment: 'ops-smoke',
    latitude,
    longitude,
    ...(darkStoreId ? { darkStoreId } : {}),
  };

  let created;
  try {
    created = await httpJson('/api/orders', { method: 'POST', token: customer.accessToken, body: orderBody });
  } catch (e) {
    // Some datasets may have products tied to inactive stores; retry without explicit storeId
    if (e?.data?.error === 'STORE_NOT_AVAILABLE') {
      console.warn('⚠️ STORE_NOT_AVAILABLE; retrying create order without darkStoreId');
      const retryBody = { ...orderBody };
      delete retryBody.darkStoreId;
      created = await httpJson('/api/orders', { method: 'POST', token: customer.accessToken, body: retryBody });
    } else {
      throw e;
    }
  }
  const orderId = Number(created?.orderId || created?.order?.id || 0);
  if (!orderId) throw new Error(`Order create response missing orderId: ${JSON.stringify(created)}`);
  console.log('✅ order created:', { orderId, darkStoreId: created?.order?.dark_store_id ?? darkStoreId });

  // Admin
  const adminUser = await ensureAdminUser();
  const admin = await login(adminUser.email, adminUser.password);
  if (!admin.accessToken) throw new Error('Admin login failed: no accessToken');
  console.log('✅ admin login:', admin.user?.email, admin.user?.role);

  const adminOrders = await httpJson(`/api/admin/orders?tab=all&q=${orderId}&limit=10&offset=0`, { token: admin.accessToken });
  const found = (adminOrders?.orders || []).find((o) => Number(o.id) === orderId);
  console.log('✅ admin/orders found:', Boolean(found), found ? { status: found.status, returned_qty_total: found.returned_qty_total } : null);

  // Force status to picked_up (eligible for returns)
  const statusRes = await httpJson(`/api/orders/${orderId}/status?force=1`, {
    method: 'PATCH',
    token: admin.accessToken,
    body: { status: 'picked_up' },
  });
  console.log('✅ status patched:', statusRes?.from, '→', statusRes?.to);

  const summary1 = await httpJson(`/api/orders/${orderId}/return-summary`, { token: admin.accessToken });
  console.log('✅ return summary (before):', Array.isArray(summary1?.items) ? summary1.items : summary1);

  const ret = await httpJson(`/api/orders/${orderId}/return`, {
    method: 'POST',
    token: admin.accessToken,
    body: { reason: 'ops-smoke' }, // full return
  });
  console.log('✅ return done:', { delta: ret?.delta?.length ?? null });

  const adminOrders2 = await httpJson(`/api/admin/orders?tab=all&q=${orderId}&limit=10&offset=0`, { token: admin.accessToken });
  const found2 = (adminOrders2?.orders || []).find((o) => Number(o.id) === orderId);
  console.log('✅ returned_qty_total (after):', found2 ? found2.returned_qty_total : null);

  const audit = await httpJson(`/api/admin/audit?entityType=order&entityId=${orderId}&limit=20&offset=0`, { token: admin.accessToken });
  console.log('✅ audit events:', (audit?.events || audit?.items || []).length);
  for (const e of (audit?.events || audit?.items || [])) {
    console.log('-', e.action, e.entity_type, e.entity_id, e.created_at || e.createdAt);
  }

  console.log('\n✅ Ops smoke-check finished.');
}

main().catch((e) => {
  console.error('❌ Ops smoke-check failed:', e.message);
  if (e.data) console.error('   data:', JSON.stringify(e.data, null, 2));
  process.exit(1);
});

