import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, AlertCircle } from "lucide-react";
import { apiLogin, getCurrentUser } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password"); // Password field is for UI completeness
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If a user is already logged in, redirect them to the dashboard.
    if (getCurrentUser()) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Our mock API only needs the username for the demo.
      const user = await apiLogin(username);

      if (user) {
        navigate("/");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-900">
            Bull Horn Analytics
          </CardTitle>
          <CardDescription>
            Sign in to access your business intelligence platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Sign In"}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium mb-2 text-blue-900">
              Demo Credentials:
            </h4>
            <div className="text-xs space-y-1 text-blue-700">
              <div>
                <strong>Admin:</strong> admin / any password
              </div>
              <div>
                <strong>Manager:</strong> manager1 / any password
              </div>
              <div>
                <strong>Cashier:</strong> cashier1 / any password
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
