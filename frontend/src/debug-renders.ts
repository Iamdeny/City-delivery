// Временный файл для отладки бесконечного цикла
let renderCount = 0;

export const logRender = (componentName: string, props?: any) => {
  renderCount++;
  
  if (renderCount > 50) {
    console.error(`🚨 INFINITE LOOP DETECTED in ${componentName}! Render count: ${renderCount}`);
    console.trace();
    
    // Останавливаем выполнение
    if (renderCount > 100) {
      throw new Error(`STOPPED: Infinite loop in ${componentName}`);
    }
  } else {
    console.log(`🔄 Render #${renderCount}: ${componentName}`, props);
  }
};

export const resetRenderCount = () => {
  renderCount = 0;
};


