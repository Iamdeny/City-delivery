/**
 * Скрипт для скачивания изображений с сайта Самоката
 * Запуск: node scripts/download-images.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Создаем папки, если их нет
const promotionsDir = path.join(__dirname, '../public/images/promotions');
const bargainShelfDir = path.join(__dirname, '../public/images/bargain-shelf');

[promotionsDir, bargainShelfDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Скачивает изображение по URL
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✓ Скачано: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Редирект
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Ошибка ${response.statusCode} для ${url}`));
      }
    }).on('error', reject);
  });
}

// Примеры URL изображений с Самоката (нужно заменить на реальные)
const imageUrls = {
  // Акции
  promotions: [
    'https://damcdn.samokat.ru/dam-storage-ext-env-prod/2026/01/05efa68d-2be5-451b-8282-21f92a043568'
  ],
  // Выгодная полка
  bargainShelf: [
    // Добавьте реальные URL изображений товаров
  ],
};

console.log('Для использования этого скрипта:');
console.log('1. Откройте сайт Самоката в браузере');
console.log('2. Откройте DevTools (F12) -> Network -> Img');
console.log('3. Найдите URL изображений');
console.log('4. Добавьте их в массив imageUrls выше');
console.log('5. Запустите скрипт: node scripts/download-images.js');

// Раскомментируйте для скачивания:

Promise.all([
  ...imageUrls.promotions.map((url, idx) => 
    downloadImage(url, path.join(promotionsDir, `promo-${idx + 1}.jpg`))
  ),
  ...imageUrls.bargainShelf.map((url, idx) => 
    downloadImage(url, path.join(bargainShelfDir, `${idx + 1}.jpg`))
  ),
]).then(() => {
  console.log('Все изображения скачаны!');
}).catch(err => {
  console.error('Ошибка:', err.message);
});

