/**
 * DarkStores HTTP interface (inventory module).
 *
 * GET /api/dark-stores?includeInactive=true&withStats=true
 * GET /api/dark-stores/:id?withStats=true
 * GET /api/dark-stores/nearest?lat=...&lng=...
 */

const express = require('express');
const { query } = require('../../../../config/database');

function parseBool(value) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null) return false;
  const s = String(value).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

function createDarkStoresRouter({ listDarkStores, getDarkStore }) {
  const router = express.Router();

  router.get('/nearest', async (req, res, next) => {
    try {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ success: false, error: 'INVALID_COORDS', message: 'lat/lng required' });
      }

      // Dark Store First: only return store if within its delivery radius.
      const inRadiusResult = await query(
        `SELECT * FROM (
          SELECT 
            id,
            name,
            address,
            latitude,
            longitude,
            delivery_radius,
            is_active,
            (6371 * acos(
              cos(radians($1)) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) *
              sin(radians(latitude))
            )) AS distance_km
          FROM dark_stores
          WHERE is_active = true
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        ) AS stores_with_distance
        WHERE distance_km <= delivery_radius / 1000
        ORDER BY distance_km ASC
        LIMIT 1`,
        [lat, lng]
      );

      if (inRadiusResult.rows[0]) {
        const s = inRadiusResult.rows[0];
        return res.json({
          success: true,
          store: s,
          selected: { darkStoreId: Number(s.id), distanceKm: Number(s.distance_km) },
        });
      }

      const nearestResult = await query(
        `SELECT 
          id,
          name,
          address,
          latitude,
          longitude,
          delivery_radius,
          is_active,
          (6371 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )) AS distance_km
        FROM dark_stores
        WHERE is_active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY distance_km ASC
        LIMIT 1`,
        [lat, lng]
      );

      if (!nearestResult.rows[0]) {
        return res.status(404).json({ success: false, error: 'NO_STORES', message: 'Нет доступных складов' });
      }

      const n = nearestResult.rows[0];
      return res.status(400).json({
        success: false,
        error: 'DELIVERY_UNAVAILABLE',
        message: `Доставка недоступна. Ближайший склад: ${n.name} (${Number(n.distance_km).toFixed(1)} км). Радиус: ${(Number(n.delivery_radius) / 1000).toFixed(1)} км`,
        details: {
          nearestStoreId: Number(n.id),
          nearestStore: n.name,
          distanceKm: Number(n.distance_km),
          storeRadiusKm: Number(n.delivery_radius) / 1000,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const includeInactive = parseBool(req.query.includeInactive);
      const withStats = parseBool(req.query.withStats);
      const result = await listDarkStores.execute({ includeInactive, withStats });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'INVALID_ID' });
      }

      const withStats = parseBool(req.query.withStats);
      const result = await getDarkStore.execute({ id, withStats });
      if (!result.success && result.error === 'NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'NOT_FOUND' });
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createDarkStoresRouter };

