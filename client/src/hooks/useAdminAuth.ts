import { useState, useEffect } from "react";

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  username: string | null;
  loginTime: string | null;
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    username: null,
    loginTime: null,
  });

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/admin/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          admin: data.admin,
        };
      }
      return { valid: false };
    } catch (error) {
      console.error("Token verification error:", error);
      return { valid: false };
    }
  };

  const login = async (credentials: {
    username: string;
    password: string;
    accessCode: string;
  }) => {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("admin_token", data.token);
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: data.token,
          username: credentials.username,
          loginTime: new Date().toISOString(),
        });
        
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      username: null,
      loginTime: null,
    });
  };

  const refreshAuth = async () => {
    const token = localStorage.getItem("admin_token");
    
    if (!token) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const verification = await verifyToken(token);
    
    if (verification.valid && verification.admin) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        token,
        username: verification.admin.username,
        loginTime: verification.admin.loginTime,
      });
    } else {
      localStorage.removeItem("admin_token");
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        username: null,
        loginTime: null,
      });
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshAuth,
  };
}