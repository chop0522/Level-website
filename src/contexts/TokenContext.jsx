import { createContext, useState, useEffect } from 'react';

/**
 * 認証 & ユーザー情報コンテキスト
 *
 *  token         : JWT (localStorage に永続化)
 *  setToken      : JWT setter
 *  userRole      : 'admin' / 'user'
 *  setUserRole   : 役割 setter
 *  userInfo      : /api/userinfo で取得した基本情報
 *  setUserInfo   : setter
 *  handleLogout  : 全て初期化 & localStorage クリア
 */
export const AuthContext = createContext({
  token: '',
  setToken: () => {},
  userRole: 'user',
  setUserRole: () => {},
  userInfo: null,
  setUserInfo: () => {},
  handleLogout: () => {}
});

export const AuthProvider = ({ children }) => {
  // JWT は localStorage と同期
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || '');
  const [userRole, setUserRole]   = useState('user');
  const [userInfo, setUserInfo]   = useState(null);

  // token を更新したら localStorage へも保存
  const setToken = (newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    setToken('');
    setUserRole('user');
    setUserInfo(null);
  };

  // ページ読込時に localStorage から token を反映（他タブとの同期用）
  useEffect(() => {
    const listener = () => setTokenState(localStorage.getItem('token') || '');
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);

  return (
    <AuthContext.Provider value={{
      token,
      setToken,
      userRole,
      setUserRole,
      userInfo,
      setUserInfo,
      handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 旧コンポーネント名との後方互換 (import { TokenProvider } …)
export { AuthProvider as TokenProvider };
