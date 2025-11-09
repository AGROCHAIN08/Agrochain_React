import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Your backend API
});

/* Later, you can add interceptors here to automatically attach
  authentication tokens to every request.
*/

export default api;