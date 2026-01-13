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
  action: 'BORROW' | 'RETURN' | 'MAINTENANCE_IN' | 'MAINTENANCE_OUT' | 'DISPATCH';
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED';
  due_date: string | null;
  reason: string;
  admin_note: string;
  equipment: string; // uuid
  user: number; // user id
  image?: string;
  admin_verifier?: number;
  location?: string;
  location_details?: {
    uuid: string;
    name: string;
    full_path: string;
  };
  zone?: string;
  cabinet?: string;
  number?: string;
  equipment_detail?: {
    uuid: string;
    name: string;
    location?: string;
    zone?: string;
    cabinet?: string;
    number?: string;
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

  approveReturn: async (id: number, data?: any): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/approve-return/`, data);
    return response.data;
  },

  rejectReturn: async (id: number, reason?: string): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/reject-return/`, { rejection_reason: reason });
    return response.data;
  },

  approveBorrow: async (id: number, admin_note?: string): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/approve-borrow/`, { admin_note });
    return response.data;
  },

  rejectBorrow: async (id: number, reason?: string): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/reject-borrow/`, { rejection_reason: reason });
    return response.data;
  },

  bulkApprove: async (transactionIds: number[], admin_note?: string): Promise<any> => {
    const response = await client.post('/transactions/bulk-approve/', { 
        transaction_ids: transactionIds,
        admin_note: admin_note 
    });
    return response.data;
  },

  dispatch: async (data: { equipment_uuid: string; reason?: string; image?: File } | FormData): Promise<Transaction> => {
    const isFormData = data instanceof FormData;
    const response = await client.post('/transactions/dispatch/', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  approveDispatch: async (id: number, admin_note?: string): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/approve-dispatch/`, { admin_note });
    return response.data;
  },

  rejectDispatch: async (id: number, reason?: string): Promise<Transaction> => {
    const response = await client.post(`/transactions/${id}/reject-dispatch/`, { rejection_reason: reason });
    return response.data;
  },
};
