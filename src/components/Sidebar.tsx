import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, BarChart2, BrainCircuit, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { Button } from './ui/button';
import { config } from '@/lib/config';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/ai-insights', label: 'AI Insights', icon: BrainCircuit },
  { path: '/users', label: 'Users', icon: Users },
];

const SidebarNavLink = ({ to, icon: Icon, children }: { to: string, icon: React.ElementType, children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`
    }
  >
    <Icon className="mr-3 h-5 w-5" />
    {children}
  </NavLink>
);

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-card border-r fixed h-full">
      <div className="flex items-center h-16 px-6 border-b">
        <BrainCircuit className="h-7 w-7 text-primary" />
        <h1 className="ml-3 text-lg font-bold tracking-tight">{config.app.name}</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <SidebarNavLink key={item.path} to={item.path} icon={item.icon}>
            {item.label}
          </SidebarNavLink>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button onClick={logout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
} 