/**
 * DarkStoreRepository (Postgres)
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

function parseBool(value) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null) return false;
  const s = String(value).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

function createDarkStoreRepositoryPg() {
  return {
    async list({ includeInactive = false, withStats = false } = {}) {
      return metrics.timeOp('inventory.darkStores.list', async () => {
        const include = parseBool(includeInactive);
        const stats = parseBool(withStats);

        const where = include ? '' : 'WHERE ds.is_active = true';

        const baseFields = `
          ds.id,
          ds.name,
          ds.address,
          ds.latitude,
          ds.longitude,
          ds.phone,
          ds.email,
          ds.is_active,
          ds.opening_time,
          ds.closing_time,
          ds.delivery_radius,
          ds.delivery_fee,
          ds.min_order_amount,
          ds.created_at
        `;

        const statsFields = `
          ,
          (SELECT COUNT(*)::int FROM products p WHERE p.dark_store_id = ds.id) AS products_count,
          (SELECT COUNT(*)::int FROM products p WHERE p.dark_store_id = ds.id AND (p.in_stock = false OR p.stock_quantity <= 0)) AS out_of_stock_count,
          (SELECT COUNT(*)::int FROM orders o WHERE o.dark_store_id = ds.id AND o.status IN ('pending','preparing','picking','ready','assigned_to_courier','picked_up','delivering')) AS active_orders_count,
          (SELECT MAX(o.created_at) FROM orders o WHERE o.dark_store_id = ds.id) AS last_order_at
        `;

        const sql = `
          SELECT
            ${baseFields}
            ${stats ? statsFields : ''}
          FROM dark_stores ds
          ${where}
          ORDER BY ds.is_active DESC, ds.id ASC
        `;

        const result = await query(sql);
        return result.rows;
      });
    },

    async getById(id, { withStats = false } = {}) {
      return metrics.timeOp('inventory.darkStores.getById', async () => {
        const stats = parseBool(withStats);

        const baseFields = `
          ds.id,
          ds.name,
          ds.address,
          ds.latitude,
          ds.longitude,
          ds.phone,
          ds.email,
          ds.is_active,
          ds.opening_time,
          ds.closing_time,
          ds.delivery_radius,
          ds.delivery_fee,
          ds.min_order_amount,
          ds.created_at
        `;

        const statsFields = `
          ,
          (SELECT COUNT(*)::int FROM products p WHERE p.dark_store_id = ds.id) AS products_count,
          (SELECT COUNT(*)::int FROM products p WHERE p.dark_store_id = ds.id AND (p.in_stock = false OR p.stock_quantity <= 0)) AS out_of_stock_count,
          (SELECT COUNT(*)::int FROM orders o WHERE o.dark_store_id = ds.id AND o.status IN ('pending','preparing','picking','ready','assigned_to_courier','picked_up','delivering')) AS active_orders_count,
          (SELECT MAX(o.created_at) FROM orders o WHERE o.dark_store_id = ds.id) AS last_order_at
        `;

        const sql = `
          SELECT
            ${baseFields}
            ${stats ? statsFields : ''}
          FROM dark_stores ds
          WHERE ds.id = $1
          LIMIT 1
        `;

        const result = await query(sql, [id]);
        return result.rows.length ? result.rows[0] : null;
      });
    },

    async create(data) {
      return metrics.timeOp('inventory.darkStores.create', async () => {
        const payload = data || {};
        const res = await query(
          `INSERT INTO dark_stores
            (name, address, latitude, longitude, phone, email, is_active, opening_time, closing_time, delivery_radius, delivery_fee, min_order_amount)
           VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           RETURNING
            id, name, address, latitude, longitude, phone, email, is_active, opening_time, closing_time, delivery_radius, delivery_fee, min_order_amount, created_at`,
          [
            payload.name,
            payload.address,
            payload.latitude ?? null,
            payload.longitude ?? null,
            payload.phone ?? null,
            payload.email ?? null,
            payload.is_active ?? true,
            payload.opening_time ?? null,
            payload.closing_time ?? null,
            payload.delivery_radius ?? null,
            payload.delivery_fee ?? null,
            payload.min_order_amount ?? null,
          ]
        );
        return res.rows[0];
      });
    },

    async update(id, patch) {
      return metrics.timeOp('inventory.darkStores.update', async () => {
        const p = patch || {};
        const sets = [];
        const values = [];
        let i = 1;

        const set = (field, value) => {
          sets.push(`${field} = $${i}`);
          values.push(value);
          i += 1;
        };

        if (p.name !== undefined) set('name', p.name);
        if (p.address !== undefined) set('address', p.address);
        if (p.latitude !== undefined) set('latitude', p.latitude);
        if (p.longitude !== undefined) set('longitude', p.longitude);
        if (p.phone !== undefined) set('phone', p.phone);
        if (p.email !== undefined) set('email', p.email);
        if (p.is_active !== undefined) set('is_active', p.is_active);
        if (p.opening_time !== undefined) set('opening_time', p.opening_time);
        if (p.closing_time !== undefined) set('closing_time', p.closing_time);
        if (p.delivery_radius !== undefined) set('delivery_radius', p.delivery_radius);
        if (p.delivery_fee !== undefined) set('delivery_fee', p.delivery_fee);
        if (p.min_order_amount !== undefined) set('min_order_amount', p.min_order_amount);

        if (sets.length === 0) return await this.getById(id);

        values.push(id);
        const idIdx = i;

        const res = await query(
          `UPDATE dark_stores
           SET ${sets.join(', ')}
           WHERE id = $${idIdx}
           RETURNING
            id, name, address, latitude, longitude, phone, email, is_active, opening_time, closing_time, delivery_radius, delivery_fee, min_order_amount, created_at`,
          values
        );
        return res.rows[0] || null;
      });
    },
  };
}

module.exports = { createDarkStoreRepositoryPg };

