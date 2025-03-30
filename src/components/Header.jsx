// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

function Header({ userRole = 'user' }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>Board Game Cafe</h1>

      <nav className={styles.navLinks}>
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/reservation">Reservation</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/mypage">MyPage</Link>
        {userRole === 'admin' && (
          <Link to="/admin">Admin</Link>
        )}
      </nav>
    </header>
  );
}

export default Header;