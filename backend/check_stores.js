const { query } = require('./src/config/database');
const logger = require('./src/utils/logger');

async function checkStores() {
  try {
    const result = await query('SELECT id, name, latitude, longitude, delivery_radius FROM dark_stores');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStores();
