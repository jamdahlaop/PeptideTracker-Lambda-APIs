// App Configuration Helper
// This file provides easy access to API endpoints and configuration

export interface AppConfig {
  api: {
    baseUrl: string;
    endpoints: {
      hello: string;
      auth: {
        register: string;
        login: string;
        verify: string;
      };
      sessionsValidator: string;
    };
  };
  aws: {
    region: string;
    environment: string;
  };
  features: {
    cors: boolean;
    logging: boolean;
    testing: boolean;
  };
}

export interface ApiEndpoints {
  hello: string;
  auth: {
    register: string;
    login: string;
    verify: string;
  };
  sessionsValidator: string;
  sessionValidation: string;
}

// Load configuration based on environment
function loadConfig(): AppConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  // In a real app, you might load this from a config file or environment variables
  const configs = {
    development: {
      api: {
        baseUrl: "https://l3349zs8n0.execute-api.us-east-1.amazonaws.com/dev",
        endpoints: {
          hello: "/hello",
          auth: {
            register: "/auth/register",
            login: "/auth/login",
            verify: "/auth/verify"
          },
          sessionsValidator: "/sessions-validator",
          sessionValidation: "/session-validation"
        }
      },
      aws: {
        region: "us-east-1",
        environment: "dev"
      },
      features: {
        cors: true,
        logging: true,
        testing: true
      }
    },
    production: {
      api: {
        baseUrl: "https://your-production-api.execute-api.us-east-1.amazonaws.com/prod",
        endpoints: {
          hello: "/hello",
          auth: {
            register: "/auth/register",
            login: "/auth/login",
            verify: "/auth/verify"
          },
          sessionsValidator: "/sessions-validator",
          sessionValidation: "/session-validation"
        }
      },
      aws: {
        region: "us-east-1",
        environment: "prod"
      },
      features: {
        cors: true,
        logging: true,
        testing: false
      }
    }
  };

  return configs[environment as keyof typeof configs] || configs.development;
}

// Export the configuration
export const config = loadConfig();

// Helper functions for easy API access
export const api = {
  // Get full URL for an endpoint
  url: (endpoint: string): string => {
    return `${config.api.baseUrl}${endpoint}`;
  },

  // Get all endpoints with full URLs
  endpoints: {
    hello: config.api.baseUrl + config.api.endpoints.hello,
    auth: {
      register: config.api.baseUrl + config.api.endpoints.auth.register,
      login: config.api.baseUrl + config.api.endpoints.auth.login,
      verify: config.api.baseUrl + config.api.endpoints.auth.verify
    },
    credentialValidator: config.api.baseUrl + config.api.endpoints.credentialValidator
  },

  // Make API calls with proper headers
  call: async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const url = api.url(endpoint);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(config.features.cors && { 'Access-Control-Allow-Origin': '*' })
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    if (config.features.logging) {
      console.log(`API Call: ${options.method || 'GET'} ${url}`);
    }

    return fetch(url, requestOptions);
  }
};

// Export individual endpoint URLs for convenience
export const endpoints = api.endpoints;

// Example usage:
// import { api, endpoints, config } from './app-config';
// 
// // Using the helper
// const response = await api.call('/hello');
// 
// // Using direct endpoints
// const response = await fetch(endpoints.hello);
// 
// // Using the config
// console.log(config.api.baseUrl);
