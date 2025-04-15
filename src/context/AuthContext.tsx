
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

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

    // Log the current users in storage for debugging
    console.log("Current users in storage:", JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]"));
  }, []);

  const login = (username: string, password: string) => {
    // Get all users and convert to lowercase for case-insensitive comparison
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    console.log("Attempting login for:", username);
    console.log("Available users:", users);
    
    // Case insensitive username matching
    const user = users.find(
      (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      setIsAuthenticated(true);
      setUsername(user.username); // Use the stored username case
      localStorage.setItem("currentUser", JSON.stringify({ username: user.username }));
      toast.success(`Welcome back, ${user.username}!`);
      return true;
    }
    
    toast.error("Invalid username or password");
    return false;
  };

  const signup = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    
    // Case insensitive check if user already exists
    if (users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
      toast.error("Username already exists");
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
    toast.success(`Account created successfully. Welcome, ${username}!`);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem("currentUser");
    toast.info("You have been logged out");
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
