import api from './api';
import type { AuthResponse, ApiResponse } from '../types/api';

export const validateCode = (code: string) =>
  api.post<ApiResponse<{ valid: boolean }>>('/auth/validate-code', { code });

export const register = (data: {
  code: string;
  username: string;
  password: string;
  nickname: string;
}) => api.post<ApiResponse<AuthResponse>>('/auth/register', data);

export const login = (username: string, password: string) =>
  api.post<ApiResponse<AuthResponse>>('/auth/login', { username, password });

export const logout = (refreshToken: string) =>
  api.post('/auth/logout', { refreshToken });

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post('/auth/password-change', { currentPassword, newPassword });
