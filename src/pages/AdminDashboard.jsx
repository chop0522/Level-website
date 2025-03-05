// src/pages/AdminDashboard.jsx
import React from 'react';

function AdminDashboard() {
  return (
    <div className="main-content">
      <h2>管理者用ダッシュボード</h2>
      <p>予約状況や問い合わせを一覧で確認したり、編集する想定。</p>
      {/* ここも Notion API でデータを取得して表示する等 */}
    </div>
  );
}

export default AdminDashboard;