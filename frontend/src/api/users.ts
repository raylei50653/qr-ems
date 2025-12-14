import client from './client';
import type { User, PaginatedResponse } from '../types';

export const getUserList = async (page = 1, search = '') => {
  const { data } = await client.get<PaginatedResponse<User>>('/users/', {
    params: { page, search },
  });
  return data;
};

export const updateUserRole = async (id: number, role: string) => {
  const { data } = await client.patch<User>(`/users/${id}/`, { role });
  return data;
};
