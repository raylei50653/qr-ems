import client from './client';

export interface BorrowRequest {
  equipment_uuid: string;
  due_date?: string; // ISO date string
  reason?: string;
  image?: File;
}

export interface ReturnRequest {
  equipment_uuid: string;
}

export interface Transaction {
  id: number;
  action: 'BORROW' | 'RETURN' | 'MAINTENANCE_IN' | 'MAINTENANCE_OUT';
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED';
  due_date: string | null;
  reason: string;
  equipment: string; // uuid
  user: number; // user id
  image?: string;
  equipment_detail?: {
    uuid: string;
    name: string;
  };
  user_detail?: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
}

export const transactionsApi = {
  getTransactions: async (params?: any): Promise<Transaction[]> => {
    // Note: If backend implements pagination, this might return { results: [...] }
    // For now assuming list or checking response structure.
    // Standard DRF ModelViewSet returns array if not paginated or { count, next, previous, results } if paginated.
    // Let's assume pagination is enabled in settings (DEFAULT_PAGINATION_CLASS).
    // Safely handle both.
    const response = await client.get('/transactions/', { params });
    if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  borrow: async (data: BorrowRequest | FormData): Promise<Transaction> => {
    const isFormData = data instanceof FormData;
    const response = await client.post('/transactions/borrow/', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  returnRequest: async (data: ReturnRequest): Promise<Transaction> => {
    const response = await client.post('/transactions/return-request/', data);
    return response.data;
  },

  approveReturn: async (id: number): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/approve-return/`);
    return response.data;
  },

  rejectReturn: async (id: number, reason?: string): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/reject-return/`, { rejection_reason: reason });
    return response.data;
  },
};
