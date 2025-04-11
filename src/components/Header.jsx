// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

function Header({
  token = '',
  userRole = 'user',
  handleLogout
}) {
  // ▼ メニュー開閉用のState
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <header className={styles.header}>
      {/* 左側: ロゴ + ナビ */}
      <div className={styles.navLeft}>
        <h1 className={styles.logo}>Board Game Cafe</h1>

        {/* PC時に横並び表示、スマホ時は隠れてハンバーガーボタンで開閉 */}
        <nav
          className={`${styles.navLinks} ${menuOpen ? styles.showMenu : ''}`}
          onClick={() => setMenuOpen(false)} 
          // ↑ メニュー内のリンククリック後に自動でメニューを閉じる
        >
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/reservation">Reservation</Link>
          <Link to="/faq">FAQ</Link>

          {/* トークンが無い => Login, ある => MyPage */}
          {!token ? (
            <Link to="/login">Login</Link>
          ) : (
            <Link to="/mypage">MyPage</Link>
          )}

          {/* 管理者用リンク (tokenあり & role===admin) */}
          {token && userRole === 'admin' && (
            <Link to="/admin">Admin</Link>
          )}
        </nav>
      </div>

      {/* 右側: Logoutボタン & ハンバーガー */}
      <div className={styles.navRight}>
        {/* Logoutボタン (tokenがある & handleLogoutが存在する時だけ表示) */}
        {token && handleLogout && (
          <button
            onClick={handleLogout}
            type="button"
            className={styles.logoutButton}
          >
            Logout
          </button>
        )}

        {/* ハンバーガーボタン (スマホで表示) */}
        <button 
          className={styles.hamburgerBtn}
          onClick={toggleMenu}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>
    </header>
  );
}

export default Header;