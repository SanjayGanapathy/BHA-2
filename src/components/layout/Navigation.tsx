import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Brain,
  Users,
  LogOut,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { POSStore } from "@/lib/store";

const navigationItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/pos", icon: ShoppingCart, label: "Sales Terminal" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/ai-insights", icon: Brain, label: "Intelligence" },
  { to: "/users", icon: Users, label: "Users" },
];

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const location = useLocation();
  const currentUser = POSStore.getCurrentUser();

  const handleLogout = () => {
    POSStore.logout();
    window.location.href = "/login";
  };

  return (
    <nav className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-blue-900">
              Bull Horn Analytics
            </h1>
            <p className="text-sm text-blue-600">Smart Business Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <Link key={item.to} to={item.to}>
            <Button
              variant={location.pathname === item.to ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                location.pathname === item.to && "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t">
        {currentUser && (
          <div className="mb-4">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentUser.role}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}