import client from './client';
import type { Location } from '../types';

export const getLocations = async (parent?: string | null) => {
  const params: Record<string, string> = {};
  if (parent !== undefined) {
    params.parent = parent === null ? 'null' : parent;
  }
  const { data } = await client.get<Location[]>('/locations/', { params });
  return data;
};

export const getLocationDetail = async (uuid: string) => {
  const { data } = await client.get<Location>(`/locations/${uuid}/`);
  return data;
};

export const createLocation = async (data: Partial<Location>) => {
  const { data: response } = await client.post<Location>('/locations/', data);
  return response;
};

export const updateLocation = async (uuid: string, data: Partial<Location>) => {
  const { data: response } = await client.patch<Location>(`/locations/${uuid}/`, data);
  return response;
};

export const deleteLocation = async (uuid: string) => {
  await client.delete(`/locations/${uuid}/`);
};
