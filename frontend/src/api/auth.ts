import client from './client';
import type { User } from '../types';

interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  // 1. Get Token
  const { data: tokens } = await client.post<TokenResponse>('/auth/token/', { username, password });
  
  // 2. Set temporary header for the second request (or let the store handle it, but here we manually handle it to fetch user)
  // We can't use useAuthStore here easily because we are inside a function. 
  // We can just pass the header explicitly.
  const { data: user } = await client.get<User>('/users/me/', {
    headers: { Authorization: `Bearer ${tokens.access}` }
  });

  return { ...tokens, user };
};

export const register = async (data: { username: string, email: string, password: string, password2: string }): Promise<LoginResponse> => {
  const { data: response } = await client.post<LoginResponse>('/auth/register/', data);
  return response;
};

export const googleLogin = async (token: string): Promise<LoginResponse> => {
  const { data } = await client.post<LoginResponse>('/auth/google/', { token });
  return data;
};
