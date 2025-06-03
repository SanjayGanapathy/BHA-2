import React from "react";
import { Navigation } from "./Navigation";
import { cn } from "@/lib/utils";

interface POSLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function POSLayout({ children, className }: POSLayoutProps) {
  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0">
        <Navigation />
      </div>

      {/* Main Content */}
      <main className={cn("flex-1 overflow-auto", className)}>{children}</main>
    </div>
  );
}
