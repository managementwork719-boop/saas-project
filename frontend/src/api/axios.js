import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending/receiving HTTP-only cookies
});

// Request interceptor is no longer needed for tokens as we use HTTP-only cookies
// Browsers will automatically send the cookie with 'withCredentials: true'

export default API;
