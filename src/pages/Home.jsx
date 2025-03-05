// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="main-content">
      <h1>ボードゲームカフェへようこそ！</h1>
      <p>レトロなゲームの世界を体験しよう。</p>
      <div>
        <Link to="/menu" className="button-retro">メニューを見る</Link>
      </div>
    </div>
  );
}

export default Home;