import api from './api';

class Auth {
  static async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response;
      
      // 保存token和用户信息
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('username', user.username);
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async register(username, password, email) {
    try {
      const response = await api.post('/auth/register', { username, password, email });
      return response;
    } catch (error) {
      throw error;
    }
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/login';
  }

  static isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  static isAdmin() {
    return localStorage.getItem('userRole') === 'admin';
  }

  static getCurrentUser() {
    return {
      id: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      role: localStorage.getItem('userRole')
    };
  }
}

export default Auth; 