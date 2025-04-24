// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './retroTheme.css'; // レトロ風CSS
import { register as registerSW } from './serviceWorkerRegistration';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// オフラインキャッシュ用 Service Worker を有効化
registerSW();