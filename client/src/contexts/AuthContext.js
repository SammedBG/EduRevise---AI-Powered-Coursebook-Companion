import React from 'react';

const AuthContext = React.createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: false
});

export default AuthContext;
