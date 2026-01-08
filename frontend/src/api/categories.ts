import client from './client';
import type { Category, PaginatedResponse } from '../types';

export const getCategories = async () => {
  const { data } = await client.get<PaginatedResponse<Category>>('/categories/');
  return data;
};

export const createCategory = async (data: Partial<Category>) => {
  const { data: response } = await client.post<Category>('/categories/', data);
  return response;
};

export const updateCategory = async (id: number, data: Partial<Category>) => {
  const { data: response } = await client.patch<Category>(`/categories/${id}/`, data);
  return response;
};

export const deleteCategory = async (id: number) => {
  await client.delete(`/categories/${id}/`);
};
