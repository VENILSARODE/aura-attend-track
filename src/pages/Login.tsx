
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    let success;
    if (isLogin) {
      success = login(username, password);
      if (!success) {
        setError("Invalid username or password");
        return;
      }
    } else {
      success = signup(username, password);
      if (!success) {
        setError("Username already exists");
        return;
      }
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md bg-slate-900 border border-slate-800 text-white shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Attendance Tracking System
          </CardTitle>
          <CardDescription className="text-slate-400 text-center">
            {isLogin ? "Login to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-900/20 p-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            
            <Button type="submit" className="w-full">
              {isLogin ? "Login" : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-primary"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
