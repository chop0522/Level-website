import { createContext } from 'react';

/**
 * グローバル認証コンテキスト
 * token / setToken / userRole / handleLogout を共有
 */
export const AuthContext = createContext({
  token: '',
  setToken: () => {},
  userRole: 'user',
  handleLogout: () => {}
});
