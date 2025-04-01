// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

function Header({
  token = '',
  userRole = 'user',
  handleLogout
}) {
  return (
    <header className={styles.header}>
      {/* 左側ブロック: ロゴ＋主要リンク */}
      <div className={styles.navLeft}>
        <h1 className={styles.logo}>Board Game Cafe</h1>

        <nav className={styles.navLinks}>
          {/* ホーム */}
          <Link to="/">Home</Link>

          {/* メニュー */}
          <Link to="/menu">Menu</Link>

          {/* 予約 */}
          <Link to="/reservation">Reservation</Link>

          {/* FAQ */}
          <Link to="/faq">FAQ</Link>

          {/*
            - トークンが無い => Login 
            - トークンが有る => MyPage
          */}
          {!token ? (
            <Link to="/login">Login</Link>
          ) : (
            <Link to="/mypage">MyPage</Link>
          )}

          {/*
            管理者なら Adminリンクも
          */}
          {token && userRole === 'admin' && (
            <Link to="/admin">Admin</Link>
          )}
        </nav>
      </div>

      {/* 右側ブロック: Logoutボタン (ある場合のみ) */}
      <div className={styles.navRight}>
        {token && handleLogout && (
          <button
            onClick={handleLogout}
            type="button"
            className={styles.logoutButton}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;