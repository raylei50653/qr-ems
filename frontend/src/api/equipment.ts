import client from './client';
import type { Equipment, PaginatedResponse } from '../types';
import type { Transaction } from './transactions';

export const getEquipmentList = async (page = 1, search = '', category = '', status = '') => {
  const { data } = await client.get<PaginatedResponse<Equipment>>('/equipment/', {
    params: { page, search, category, status },
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

export const createEquipment = async (data: Partial<Equipment>) => {
  const { data: response } = await client.post<Equipment>('/equipment/', data);
  return response;
};

export const updateEquipment = async (uuid: string, data: Partial<Equipment>) => {
  const { data: response } = await client.patch<Equipment>(`/equipment/${uuid}/`, data);
  return response;
};
