// --- Enums ---
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';
export type EquipmentStatus = 'AVAILABLE' | 'BORROWED' | 'PENDING_RETURN' | 'MAINTENANCE' | 'LOST' | 'DISPOSED';
export type TransactionStatus = 'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED';

// --- Models ---

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Equipment {
  uuid: string;
  name: string;
  description: string;
  status: EquipmentStatus;
  rdf_metadata?: Record<string, any>;
  current_possession?: {
    user_id: number;
    username: string;
    due_date: string;
  };
}

export interface Transaction {
  id: number;
  equipment: number;
  equipment_uuid?: string;
  user: User;
  action: 'BORROW' | 'RETURN' | 'MAINTENANCE_IN' | 'MAINTENANCE_OUT';
  status: TransactionStatus;
  due_date?: string;
  reason?: string;
  created_at: string;
  completed_at?: string;
}

// --- API Responses ---
export interface PaginatedResponse<T> {
  results: T[]; // DRF default pagination uses 'results', 'count', 'next', 'previous'
  count: number;
  next?: string;
  previous?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    detail: string;
    field_errors?: Record<string, string[]>;
  };
}
