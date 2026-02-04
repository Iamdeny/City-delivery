const { query } = require('./src/config/database');

async function updateRadius() {
  try {
    await query('UPDATE dark_stores SET delivery_radius = 10000 WHERE id = 4');
    console.log('✅ Delivery radius updated to 10km for store ID 4');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateRadius();
