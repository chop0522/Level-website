import { createContext, useState } from 'react';

/**
 * グローバル認証コンテキスト
 * token / setToken / userRole / handleLogout を共有
 */
export const AuthContext = createContext({
  token: '',
  setToken: () => {},
  userRole: 'user',
  userInfo: null,
  setUserInfo: () => {},
  handleLogout: () => {}
});


export function TokenProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState('user');
  const [userInfo, setUserInfo] = useState(null);

  // handleLogout clears localStorage & resets states
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserRole('user');
    setUserInfo(null);
  };

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
}
