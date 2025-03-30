// rc/components/Header.jsx
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

        {/*
          Logoutボタン（token & handleLogoutがある場合のみ表示）
        */}
        {token && handleLogout && (
          <button
            onClick={handleLogout}
            type="button"
            style={{ marginLeft: '10px' }}
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

export default Header;