// src/pages/Menu.jsx
import React from 'react';

function Menu() {
  return (
    <div className="main-content">
      <h2>メニュー</h2>
      <p>ドリンクや軽食、プレイ料金などを表示するページです。</p>
      {/* 実際にはNotion DBからfetchして価格や在庫を自動更新すると便利 */}
      <ul>
        <li>コーヒー：¥400</li>
        <li>紅茶：¥400</li>
        <li>ビール：¥600</li>
        <li>プレイ料金：1時間 ¥500 (パック料金あり)</li>
      </ul>
    </div>
  );
}

export default Menu;