/**
 * Inventory module (facade)
 * Owns catalog + stock/reservations concerns.
 *
 * Today:
 * - products router lives in src/routes/products.js
 * - inventory reservation logic lives in src/services/inventoryService.js
 *
 * Target:
 * - HTTP routes live under modules/inventory/interfaces/http
 * - reservation service becomes an application use-case with a DB adapter
 */

const productsRouter = require('../../routes/products');
const { createInventoryGateway } = require('./infrastructure/inventoryGateway');
const { createDarkStoreRepositoryPg } = require('./infrastructure/postgres/darkStoreRepositoryPg');
const { createInventoryRepositoryPg } = require('./infrastructure/postgres/inventoryRepositoryPg');
const { createListDarkStores } = require('./application/queries/ListDarkStores');
const { createGetDarkStore } = require('./application/queries/GetDarkStore');
const { createListInventoryProducts } = require('./application/queries/ListInventoryProducts');
const { createListInventoryReservations } = require('./application/queries/ListInventoryReservations');
const { createCreateDarkStore } = require('./application/useCases/CreateDarkStore');
const { createUpdateDarkStore } = require('./application/useCases/UpdateDarkStore');
const { createDarkStoresRouter } = require('./interfaces/http/darkStores.router');
const { createAdminDarkStoresRouter } = require('./interfaces/http/adminDarkStores.router');
const { createInventoryRouter } = require('./interfaces/http/inventory.router');

module.exports = {
  productsRouter,
  createInventoryGateway,
  createDarkStoresRouter: () => {
    const darkStoreRepository = createDarkStoreRepositoryPg();
    const listDarkStores = createListDarkStores({ darkStoreRepository });
    const getDarkStore = createGetDarkStore({ darkStoreRepository });
    return createDarkStoresRouter({ listDarkStores, getDarkStore });
  },
  createAdminDarkStoresRouter: ({ auditLogger } = {}) => {
    const darkStoreRepository = createDarkStoreRepositoryPg();
    const createDarkStore = createCreateDarkStore({ darkStoreRepository });
    const updateDarkStore = createUpdateDarkStore({ darkStoreRepository });
    return createAdminDarkStoresRouter({ createDarkStore, updateDarkStore, auditLogger });
  },
  createInventoryRouter: () => {
    const inventoryRepository = createInventoryRepositoryPg();
    const listInventoryProducts = createListInventoryProducts({ inventoryRepository });
    const listInventoryReservations = createListInventoryReservations({ inventoryRepository });
    return createInventoryRouter({ listInventoryProducts, listInventoryReservations });
  },
};

