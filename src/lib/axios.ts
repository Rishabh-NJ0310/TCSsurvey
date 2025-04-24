import axios from 'axios';

// Create a custom Axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 15000, // Increased timeout to 15 seconds for potentially slow file uploads
  withCredentials: true, // Enable sending cookies with requests
});

// Add a retry mechanism for failed requests
api.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API Response] Status: ${response.status} - ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // Handle common errors here
    if (error.response) {
      // Server responded with a status code outside of 2xx
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response was received
      console.error('Network Error:', error.message);
      // Add more detailed error logging
      console.error('Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to check if API is available
export const checkApiConnection = async () => {
  try {
    const response = await api.get('/test', { timeout: 5000 });
    return response.data.status === 'success';
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

export default api;