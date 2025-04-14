
import { createContext, useState, useContext, useEffect, ReactNode } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  signup: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data for demo
const USERS_STORAGE_KEY = "attendanceTracker_users";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in from local storage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setIsAuthenticated(true);
      setUsername(JSON.parse(storedUser).username);
    }

    // Initialize users if not exist
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
    }
  }, []);

  const login = (username: string, password: string) => {
    // In a real app, this would be an API call
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const user = users.find(
      (u: any) => u.username === username && u.password === password
    );

    if (user) {
      setIsAuthenticated(true);
      setUsername(username);
      localStorage.setItem("currentUser", JSON.stringify({ username }));
      return true;
    }
    return false;
  };

  const signup = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    
    // Check if user already exists
    if (users.some((u: any) => u.username === username)) {
      return false;
    }
    
    // Add new user
    const newUser = { id: Date.now().toString(), username, password };
    localStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify([...users, newUser])
    );
    
    // Auto login after signup
    setIsAuthenticated(true);
    setUsername(username);
    localStorage.setItem("currentUser", JSON.stringify({ username }));
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, username, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
