import React from "react";
import { Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-blue-600", sizeClasses[size], className)}
    />
  );
}

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  className?: string;
}

export function LoadingScreen({
  message = "Loading...",
  showLogo = true,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4",
        className,
      )}
    >
      <div className="text-center">
        {showLogo && (
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full animate-pulse">
              <Target className="h-12 w-12 text-white" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-4">
          <LoadingSpinner size="lg" />
          <span className="text-lg font-medium text-blue-900">{message}</span>
        </div>

        {showLogo && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-blue-900">
              Bull Horn Analytics
            </h1>
            <p className="text-blue-600">Smart Business Intelligence</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
        className,
      )}
    >
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center gap-3">
          <LoadingSpinner />
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export function LoadingCard({
  lines = 3,
  showAvatar = false,
  className,
}: LoadingCardProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="bg-white rounded-lg p-6 space-y-4">
        {showAvatar && (
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButton({
  isLoading,
  children,
  loadingText,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        isLoading && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
