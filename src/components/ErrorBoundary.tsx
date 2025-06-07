import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import { config } from "@/lib/config";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (config.env.isDevelopment) {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    // In production, you would send this to an error reporting service
    if (config.env.isProduction) {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Example: Send to error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem("bullhorn_current_user") || "anonymous",
    };

    // In a real application, send this to your error reporting service
    console.error("Error Report:", errorReport);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleContactSupport = () => {
    window.open(
      `mailto:${config.app.supportEmail}?subject=Error Report - Bull Horn Analytics`,
      "_blank",
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-red-600">
                Something went wrong
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                We&apos;re sorry for the inconvenience. An unexpected error has
                occurred.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {config.env.isDevelopment && this.state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs">
                  <p className="font-medium text-red-800 mb-1">
                    Error Details:
                  </p>
                  <p className="text-red-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button onClick={this.handleReload} className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </Button>

                <Button
                  onClick={this.handleContactSupport}
                  variant="ghost"
                  className="w-full gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  If this problem persists, please contact our support team.
                </p>
                <p className="mt-1">Error ID: {Date.now()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: React.ErrorInfo) => {
    if (config.env.isDevelopment) {
      console.error("Handled error:", error, errorInfo);
    }

    // In production, log to error service
    if (config.env.isProduction) {
      // Log to error reporting service
    }
  };

  return { handleError };
};
