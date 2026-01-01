import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Убедитесь, что элемент существует
const container = document.getElementById('root');

if (!container) {
  // Создаем элемент, если его нет
  const rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
