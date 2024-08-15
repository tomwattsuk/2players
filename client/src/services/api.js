// client/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ... (previous functions)

export const getUserProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};