// src/components/Header.jsx
import React, { useState, Suspense, useContext } from 'react';
import { Link } from 'react-router-dom';
import { IconButton } from '@mui/material';
// ---- MUI Icons (lazy loaded to keep the main bundle small) ----
const MenuIcon  = React.lazy(() => import('@mui/icons-material/Menu'));
const CloseIcon = React.lazy(() => import('@mui/icons-material/Close'));
import styles from './Header.module.css';

import { AuthContext } from '../contexts/TokenContext';

function Header() {
  const { token = '', handleLogout } = useContext(AuthContext);
  // ▼ メニュー開閉用のState
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

    return (
    <header
      className={styles.header}
      role="banner"
      style={{ position: 'relative', zIndex: 3000 }}
    >
      {/* 左側: ロゴ + ナビ */}
      <div className={styles.navLeft}>
        <h1 className={styles.logo}>
          <Link to="/" className={styles.brandLink} aria-label="トップへ">
            <span className={styles.logoJP}>ゲームカフェ</span>
            <span className={styles.logoDot}>.</span>
            <span className={styles.logoEN}>Level</span>
          </Link>
        </h1>

        {/* PC時に横並び表示、スマホ時は隠れてハンバーガーボタンで開閉 */}
        <nav
          className={`${styles.navLinks} ${menuOpen ? styles.showMenu : ''}`}
          aria-label="主要ナビゲーション"
          onClick={() => setMenuOpen(false)}
          // ↑ メニュー内のリンククリック後に自動でメニューを閉じる
        >
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/equipment">Equipment</Link>
          <Link to="/reservation">Reservation</Link>
          <Link to="/faq">FAQ</Link>

          {/* 未ログイン時は Sign Up & Login、ログイン後は MyPage */}
          {!token ? (
            <>
              <Link to="/signup">Sign&nbsp;Up</Link>
              <Link to="/login">Login</Link>
            </>
          ) : (
            <Link to="/mypage">MyPage</Link>
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
        <IconButton
          className={styles.hamburgerBtn}
          onClick={toggleMenu}
          aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          size="large"
        >
          <Suspense fallback={null}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </Suspense>
        </IconButton>
      </div>
    </header>
  );
}

export default Header;
