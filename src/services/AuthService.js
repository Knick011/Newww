// src/services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.baseUrl = 'https://brain-bites-api.onrender.com/api/auth';
    this.user = null;
    this.token = null;
    this.loadSavedAuth();
  }
  
  async loadSavedAuth() {
    try {
      const auth = await AsyncStorage.getItem('brainbites_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        this.user = parsed.user;
        this.token = parsed.token;
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    }
  }
  
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      this.user = data.user;
      this.token = data.token;
      
      await AsyncStorage.setItem('brainbites_auth', JSON.stringify({
        user: this.user,
        token: this.token
      }));
      
      return this.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async register(username, email, password) {
    // Similar to login but with registration endpoint
  }
  
  async logout() {
    this.user = null;
    this.token = null;
    await AsyncStorage.removeItem('brainbites_auth');
  }
  
  isAuthenticated() {
    return !!this.token;
  }
  
  getUser() {
    return this.user;
  }
  
  getToken() {
    return this.token;
  }
}

export default new AuthService();