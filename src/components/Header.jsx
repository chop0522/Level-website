// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <h1>Board Game Cafe</h1>
      <nav>
        <Link to="/" style={{ margin: '0 10px' }}>Home</Link>
        <Link to="/menu" style={{ margin: '0 10px' }}>Menu</Link>
        <Link to="/calendar" style={{ margin: '0 10px' }}>Calendar</Link>
        <Link to="/reservation" style={{ margin: '0 10px' }}>Reservation</Link>
        <Link to="/faq" style={{ margin: '0 10px' }}>FAQ</Link>
        <Link to="/mypage" style={{ margin: '0 10px' }}>MyPage</Link>
        <Link to="/admin" style={{ margin: '0 10px' }}>Admin</Link>
      </nav>
    </header>
  );
}

export default Header;