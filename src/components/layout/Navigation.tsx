import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { getCurrentUser, apiLogout } from "@/lib/api";
import { User } from "@/types";

// Define all possible navigation items with required roles
const allNavigationItems = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "manager", "cashier"],
  },
  {
    to: "/pos",
    icon: ShoppingCart,
    label: "Sales Terminal",
    roles: ["admin", "manager", "cashier"],
  },
  {
    to: "/products",
    icon: Package,
    label: "Products",
    roles: ["admin", "manager"],
  },
  {
    to: "/analytics",
    icon: BarChart3,
    label: "Analytics",
    roles: ["admin", "manager"],
  },
  {
    to: "/ai-insights",
    icon: Brain,
    label: "Bull's Eye",
    roles: ["admin", "manager"],
  },
  { to: "/users", icon: Users, label: "Users", roles: ["admin"] },
];

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Filter navigation items based on the current user's role
  const accessibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    return allNavigationItems.filter((item) =>
      item.roles.includes(currentUser.role),
    );
  }, [currentUser]);

  const handleLogout = async () => {
    await apiLogout();
    // Use navigate for a smooth client-side transition without a page reload
    navigate("/login", { replace: true });
  };

  if (!currentUser) {
    // Render nothing or a loading state if there's no user
    // This case should ideally not be hit due to the ProtectedRoute wrapper
    return null;
  }

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
        {accessibleNavItems.map((item) => (
          <Link key={item.to} to={item.to}>
            <Button
              variant={location.pathname === item.to ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                location.pathname === item.to &&
                  "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t">
        <div className="mb-4">
          <p className="text-sm font-medium">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {currentUser.role}
          </p>
        </div>
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