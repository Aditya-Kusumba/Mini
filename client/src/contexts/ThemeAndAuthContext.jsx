// ThemeAndAuthContext.js

import React, { createContext, useContext, useReducer } from 'react';

// Define the initial state
const initialState = {
  isAuthenticated: false,
  theme: 'light', // can be 'light' or 'dark'
};

// Define action types
const actionTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  TOGGLE_THEME: 'TOGGLE_THEME',
};

// Create a reducer function to handle the state changes
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.LOGIN:
      return { ...state, isAuthenticated: true };
    case actionTypes.LOGOUT:
      return { ...state, isAuthenticated: false };
    case actionTypes.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
};

// Create context
const ThemeAndAuthContext = createContext();

// Create a provider component
export const ThemeAndAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ThemeAndAuthContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeAndAuthContext.Provider>
  );
};

// Custom hook to use the context
export const useThemeAndAuth = () => useContext(ThemeAndAuthContext);
