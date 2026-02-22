/**
 * Inventory HTTP interface (inventory module).
 *
 * GET /api/inventory/:darkStoreId/products
 * GET /api/inventory/:darkStoreId/reservations
 */

const express = require('express');

function parseId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function createInventoryRouter({ listInventoryProducts, listInventoryReservations }) {
  const router = express.Router();

  router.get('/:darkStoreId/products', async (req, res, next) => {
    try {
      const darkStoreId = parseId(req.params.darkStoreId);
      if (!darkStoreId) {
        return res.status(400).json({ success: false, error: 'INVALID_STORE_ID' });
      }

      const result = await listInventoryProducts.execute({ darkStoreId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:darkStoreId/reservations', async (req, res, next) => {
    try {
      const darkStoreId = parseId(req.params.darkStoreId);
      if (!darkStoreId) {
        return res.status(400).json({ success: false, error: 'INVALID_STORE_ID' });
      }

      const result = await listInventoryReservations.execute({ darkStoreId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createInventoryRouter };

