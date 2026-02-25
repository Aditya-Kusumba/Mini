import { createContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getProfile, loginUser as loginService, logoutUser as logoutService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // e.g., { id, name, email }
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Fetch profile on initial load
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const userData = await getProfile(token);
          setUser(userData);
        } catch (err) {
          console.error("Invalid token, logging out", err);
          logout();
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

const login = useCallback(async (email, password) => {
    // loginService likely returns an object like { success: true, data: { user, accessToken, refreshToken } }
    const result = await loginService(email, password);
    return result;
    // Now, check if the login was successful and get the data you need
    if (result.success && result.data) {
        const { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken } = result.data;
        
        // Store the access token for API calls
        localStorage.setItem("accessToken", newAccessToken);
        
        // You might also want to store the refresh token
        localStorage.setItem("refreshToken", newRefreshToken);
        
        // Update your application state
        setToken(newAccessToken);
        setUser(userData);
    } else {
        // Handle login failure
        console.error("Login failed:", result.message);
    }
}, []);

  const logout = useCallback(() => {
    logoutService(); // Optional: API call to revoke token
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
