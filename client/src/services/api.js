// src/services/api.js
import axios from 'axios';

// Define the base URL for your backend API
// Make sure this matches where your Express server is running.
// If your frontend and backend are on different ports during development,
// you might have a proxy setup in package.json (for Create React App)
// or you'll need to handle CORS on the backend.
const API_BASE_URL = 'http://localhost:5001/api'; // Adjust port if needed

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // You can set other default headers here if needed
  },
});

// --- Request Interceptor ---
// This interceptor will automatically add the JWT token to the
// Authorization header for every outgoing request if a token exists.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Or however you store your token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// This interceptor can handle common responses, like unauthorized errors (401).
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);

      if (error.response.status === 401) {
        // Handle unauthorized errors (e.g., token expired or invalid)
        // You might want to redirect to login or refresh the token here.
        console.warn('Unauthorized API access (401). Token might be invalid or expired.');
        // Example: localStorage.removeItem('userToken'); window.location.href = '/login';
        // Make sure this doesn't cause infinite loops if login page itself makes API calls.
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error('API Error Request (No Response):', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error); // Important to re-throw the error so components can catch it
  }
);

export default apiClient;