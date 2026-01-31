// scripts/parse-images.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Установите зависимости: npm install axios cheerio

async function parseImages(url) {
  try {
    console.log(`Парсим: ${url}`);
    
    // Получаем HTML страницы
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Загружаем HTML в cheerio
    const $ = cheerio.load(data);
    
    // Ищем все изображения
    const images = [];
    
    // Все теги img
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      const srcset = $(elem).attr('srcset');
      const dataSrc = $(elem).attr('data-src');
      
      if (src && !src.startsWith('data:')) {
        const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
        images.push({
          type: 'img',
          url: fullUrl,
          alt: $(elem).attr('alt') || 'no-alt'
        });
      }
      
      // Обрабатываем srcset
      if (srcset) {
        const urls = srcset.split(',').map(s => {
          const url = s.trim().split(' ')[0];
          return url.startsWith('http') ? url : new URL(url, url).href;
        });
        urls.forEach(imageUrl => {
          images.push({
            type: 'srcset',
            url: imageUrl
          });
        });
      }
      
      // Lazy loading images
      if (dataSrc && !dataSrc.startsWith('data:')) {
        const fullUrl = dataSrc.startsWith('http') ? dataSrc : new URL(dataSrc, url).href;
        images.push({
          type: 'lazy',
          url: fullUrl
        });
      }
    });
    
    // Ищем в CSS background-image
    $('[style*="background-image"]').each((i, elem) => {
      const style = $(elem).attr('style');
      const match = style.match(/url\(['"]?([^'")]+)['"]?\)/);
      if (match && match[1]) {
        const imageUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], url).href;
        images.push({
          type: 'background',
          url: imageUrl
        });
      }
    });
    
    // Фильтруем уникальные URL
    const uniqueImages = [...new Set(images.map(img => img.url))].map(url => {
      return images.find(img => img.url === url);
    });
    
    console.log(`Найдено уникальных изображений: ${uniqueImages.length}`);
    
    // Сохраняем результат
    const result = {
      source: url,
      total: uniqueImages.length,
      images: uniqueImages
    };
    
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'parsed-images.json'),
      JSON.stringify(result, null, 2)
    );
    
    // Также сохраняем простой список URL
    const urlList = uniqueImages.map(img => img.url).join('\n');
    fs.writeFileSync(
      path.join(outputDir, 'image-urls.txt'),
      urlList
    );
    
    console.log('Результаты сохранены в data/parsed-images.json');
    console.log('Список URL сохранен в data/image-urls.txt');
    
    return uniqueImages;
    
  } catch (error) {
    console.error('Ошибка при парсинге:', error.message);
  }
}

// Пример использования
const sbermarketUrl = 'https://sbermarket.ru/metro';
parseImages(sbermarketUrl);