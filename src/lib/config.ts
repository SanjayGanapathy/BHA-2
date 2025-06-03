// Environment Configuration
export const config = {
  // App Information
  app: {
    name: "Bull Horn Analytics",
    version: "1.0.0",
    description: "Smart Business Intelligence & POS System",
    url: import.meta.env.VITE_APP_URL || "https://bullhornanalytics.com",
    supportEmail: "support@bullhornanalytics.com",
    salesEmail: "sales@bullhornanalytics.com",
  },

  // Environment
  env: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    isStaging: import.meta.env.VITE_APP_ENV === "staging",
  },

  // Features
  features: {
    analytics: true,
    aiInsights: true,
    multiUser: true,
    inventory: true,
    reporting: true,
    cloudSync: import.meta.env.VITE_ENABLE_CLOUD_SYNC === "true",
    notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === "true",
  },

  // API Configuration (for future backend integration)
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
    timeout: 30000,
    retries: 3,
  },

  // Analytics & Tracking
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN,
    enableTracking: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  },

  // Security
  security: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    enableTwoFactor: import.meta.env.VITE_ENABLE_2FA === "true",
  },

  // Storage
  storage: {
    prefix: "bullhorn_",
    version: "1.0",
    enableEncryption: import.meta.env.VITE_ENABLE_ENCRYPTION === "true",
  },

  // UI Configuration
  ui: {
    theme: {
      primary: "hsl(214 100% 35%)",
      primaryRgb: "37, 99, 235",
    },
    animations: {
      enabled: true,
      duration: 200,
    },
    notifications: {
      position: "top-right" as const,
      duration: 5000,
    },
  },

  // Business Logic
  business: {
    defaultTaxRate: 0.08, // 8%
    defaultCurrency: "USD",
    defaultTimezone: "America/New_York",
    lowStockThreshold: 10,
    forecasting: {
      confidenceThreshold: 60,
      maxForecastDays: 90,
    },
  },

  // Limits
  limits: {
    maxProducts: 10000,
    maxUsers: 100,
    maxSalesHistory: 50000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

// Helper functions
export const getConfig = (path: string) => {
  return path.split(".").reduce((obj: any, key) => obj?.[key], config);
};

export const isFeatureEnabled = (feature: keyof typeof config.features) => {
  return config.features[feature];
};

export const getApiUrl = (endpoint: string) => {
  return `${config.api.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};
