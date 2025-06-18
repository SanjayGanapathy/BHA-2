import { User } from "@/types";

export type Permission = 
  | "view_dashboard"
  | "view_analytics"
  | "view_ai_insights"
  | "view_users"
  | "manage_users"
  | "manage_products"
  | "view_sales"
  | "manage_sales"
  | "create_sale";

const rolePermissions: Record<User["role"], Permission[]> = {
  admin: [
    "view_dashboard",
    "view_analytics",
    "view_ai_insights",
    "view_users",
    "manage_users",
    "manage_products",
    "view_sales",
    "manage_sales",
    "create_sale"
  ],
  manager: [
    "view_dashboard",
    "view_analytics",
    "view_ai_insights",
    "manage_products",
    "view_sales",
    "manage_sales",
    "create_sale"
  ],
  cashier: [
    "view_dashboard",
    "create_sale"
  ]
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return rolePermissions[user.role]?.includes(permission) ?? false;
}

export function canManageUser(currentUser: User | null, targetUser: User): boolean {
  if (!currentUser) return false;
  
  const roleHierarchy = {
    admin: 2,
    manager: 1,
    cashier: 0
  };

  return roleHierarchy[currentUser.role] > roleHierarchy[targetUser.role];
}

export function getAccessibleRoutes(user: User | null): string[] {
  if (!user) return ["/login"];
  
  const routes: Record<Permission, string> = {
    view_dashboard: "/dashboard",
    view_analytics: "/analytics",
    view_ai_insights: "/ai-insights",
    view_users: "/users",
    manage_users: "/users",
    manage_products: "/products",
    view_sales: "/pos",
    manage_sales: "/pos",
    create_sale: "/pos"
  };

  return rolePermissions[user.role]
    .map(permission => routes[permission])
    .filter((route, index, self) => self.indexOf(route) === index); // Remove duplicates
} 