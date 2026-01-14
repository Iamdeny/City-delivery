/**
 * Скрипт для тестирования WebSocket аутентификации
 * Запуск: node scripts/test-websocket-auth.js
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

console.log('🔍 Проверка WebSocket аутентификации\n');
console.log('═'.repeat(60));

// Проверка JWT_SECRET
console.log('\n1️⃣ Проверка JWT_SECRET:');
if (!process.env.JWT_SECRET) {
  console.log('   ⚠️  JWT_SECRET не установлен в .env!');
  console.log('   💡 Используется fallback:', JWT_SECRET);
  console.log('   💡 Рекомендуется установить JWT_SECRET в .env');
} else {
  console.log('   ✅ JWT_SECRET установлен');
  console.log('   📏 Длина:', process.env.JWT_SECRET.length, 'символов');
  if (process.env.JWT_SECRET.length < 32) {
    console.log('   ⚠️  ВНИМАНИЕ: JWT_SECRET должен быть минимум 32 символа!');
  }
}

// Создание тестового токена
console.log('\n2️⃣ Создание тестового токена:');
const testUserId = 1;
const testRole = 'customer';

try {
  const testToken = jwt.sign(
    { userId: testUserId, role: testRole },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  console.log('   ✅ Токен создан успешно');
  console.log('   📏 Длина токена:', testToken.length, 'символов');
  
  // Проверка токена
  console.log('\n3️⃣ Проверка токена:');
  try {
    const decoded = jwt.verify(testToken, JWT_SECRET);
    console.log('   ✅ Токен валиден');
    console.log('   👤 User ID:', decoded.userId);
    console.log('   🎭 Role:', decoded.role);
  } catch (verifyError) {
    console.log('   ❌ Ошибка верификации:', verifyError.message);
  }
} catch (signError) {
  console.log('   ❌ Ошибка создания токена:', signError.message);
}

// Проверка с неправильным секретом
console.log('\n4️⃣ Проверка с неправильным секретом:');
try {
  const wrongToken = jwt.sign(
    { userId: testUserId, role: testRole },
    'wrong-secret'
  );
  try {
    jwt.verify(wrongToken, JWT_SECRET);
    console.log('   ⚠️  Токен прошел проверку (это не должно происходить!)');
  } catch (verifyError) {
    console.log('   ✅ Токен правильно отклонен:', verifyError.name);
  }
} catch (error) {
  console.log('   ❌ Ошибка:', error.message);
}

console.log('\n' + '═'.repeat(60));
console.log('\n💡 Рекомендации:');
console.log('   1. Убедись что JWT_SECRET установлен в backend/.env');
console.log('   2. JWT_SECRET должен быть минимум 32 символа');
console.log('   3. После изменения JWT_SECRET нужно перелогиниться');
console.log('   4. Проверь что токен передается в WebSocket: auth: { token }');
console.log('\n');
