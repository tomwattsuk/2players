// client/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Set up axios to send the token with every request
const setAuthToken = token => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/users/register`, userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/users/login`, credentials);
  return response.data;
};

export const getGames = async () => {
  const response = await axios.get(`${API_URL}/games`);
  return response.data;
};

export const createMatch = async (matchData) => {
  const response = await axios.post(`${API_URL}/matches`, matchData);
  return response.data;
};

export { setAuthToken };