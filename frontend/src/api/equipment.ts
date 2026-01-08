import client from './client';
import type { Equipment, PaginatedResponse } from '../types';
import type { Transaction } from './transactions';

export const getEquipmentList = async (page = 1, search = '', category = '', status = '', location = '') => {
  const { data } = await client.get<PaginatedResponse<Equipment>>('/equipment/', {
    params: { page, search, category, status, location },
  });
  return data;
};

export const getEquipmentDetail = async (uuid: string) => {
  const { data } = await client.get<Equipment>(`/equipment/${uuid}/`);
  return data;
};

export const getEquipmentHistory = async (uuid: string) => {
  const { data } = await client.get<Transaction[]>(`/equipment/${uuid}/history/`);
  return data;
};

export const createEquipment = async (data: Partial<Equipment> | FormData) => {
  const isFormData = data instanceof FormData;
  const { data: response } = await client.post<Equipment>('/equipment/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response;
};

export const updateEquipment = async (uuid: string, data: Partial<Equipment> | FormData) => {
  const isFormData = data instanceof FormData;
  const { data: response } = await client.patch<Equipment>(`/equipment/${uuid}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response;
};
