const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "An error occurred" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    fetchApi<{ token: string; user: User; message: string }>("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  
  createUser: (data: CreateUserData, token: string) =>
    fetchApi<{ message: string }>("/api/users/create", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
};

// Users
export const usersApi = {
  getAll: (token: string) =>
    fetchApi<User[]>("/api/users", { token }),
  
  getById: (id: number, token: string) =>
    fetchApi<User>(`/api/users/${id}`, { token }),
  
  update: (id: number, data: Partial<User>, token: string) =>
    fetchApi<{ message: string }>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),
  
  delete: (id: number, token: string) =>
    fetchApi<{ message: string }>(`/api/users/${id}`, {
      method: "DELETE",
      token,
    }),
};

// Rooms
export const roomsApi = {
  getAll: (token: string) =>
    fetchApi<Room[]>("/api/rooms", { token }),
  
  getById: (id: number, token: string) =>
    fetchApi<RoomDetails>(`/api/rooms/${id}`, { token }),
  
  create: (data: CreateRoomData, token: string) =>
    fetchApi<{ message: string }>("/api/rooms", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  
  update: (id: number, data: Partial<CreateRoomData>, token: string) =>
    fetchApi<{ message: string }>(`/api/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),
  
  delete: (id: number, token: string) =>
    fetchApi<{ message: string }>(`/api/rooms/${id}`, {
      method: "DELETE",
      token,
    }),
};

// Tenants
export const tenantsApi = {
  getAll: (token: string) =>
    fetchApi<(Tenant | string)[]>("/api/tenants", { token }),
  
  getById: (id: number, token: string) =>
    fetchApi<TenantDetails>(`/api/tenants/${id}`, { token }),
  
  checkIn: (data: CheckInData, token: string) =>
    fetchApi<{ message: string }>("/api/tenants/check-in", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  
  update: (id: number, data: Partial<Tenant>, token: string) =>
    fetchApi<{ message: string }>(`/api/tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),
  
  getOccupancies: (id: number, token: string) =>
    fetchApi<Occupancy[]>(`/api/tenants/${id}/occupancies`, { token }),
  
  getLedger: (id: number, token: string) =>
    fetchApi<LedgerEntry[]>(`/api/tenants/${id}/ledger`, { token }),
};

// Occupancies
export const occupanciesApi = {
  getAll: (token: string) =>
    fetchApi<Occupancy[]>("/api/occupancies", { token }),
  
  getById: (id: number, token: string) =>
    fetchApi<Occupancy>(`/api/occupancies/${id}`, { token }),
  
  end: (id: number, data: EndOccupancyData, token: string) =>
    fetchApi<{ message: string }>(`/api/occupancies/${id}/end`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
};

// Billings
export const billingsApi = {
  getAll: (token: string) =>
    fetchApi<Billing[]>("/api/billings", { token }),
  
  getById: (id: number, token: string) =>
    fetchApi<Billing>(`/api/billings/${id}`, { token }),
  
  generate: (data: GenerateBillingData, token: string) =>
    fetchApi<{ message: string }>("/api/billings/generate", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  
  update: (id: number, data: Partial<Billing>, token: string) =>
    fetchApi<{ message: string }>(`/api/billings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),
  
  delete: (id: number, token: string) =>
    fetchApi<{ message: string }>(`/api/billings/${id}`, {
      method: "DELETE",
      token,
    }),
};

// Payments
export const paymentsApi = {
  getAll: (token: string) =>
    fetchApi<Payment[]>("/api/payments", { token }),
  
  getById: (id: number, token: string) =>
    fetchApi<Payment>(`/api/payments/${id}`, { token }),
  
  record: (data: RecordPaymentData, token: string) =>
    fetchApi<{ message: string }>("/api/payments/record", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
};

// Reports
export const reportsApi = {
  getArrears: (token: string) =>
    fetchApi<ArrearsReport[]>("/api/reports/arrears", { token }),
  
  getIncome: (month: number, year: number, token: string) =>
    fetchApi<{ total_income: number }>("/api/reports/income", {
      method: "GET",
      body: JSON.stringify({ month, year }),
      token,
    }),
};

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager";
  created_at: string;
  updated_at: string | null;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "manager";
}

export interface Room {
  id: number;
  room_number: string;
  default_rent: number;
  capacity: number;
  status: "available" | "occupied";
  current_occupants: number;
  created_at: string;
}

export interface RoomDetails extends Room {
  current_occupants: {
    tenant_id: number;
    tenant_name: string;
    start_date: string;
    end_date: string | null;
  }[];
}

export interface CreateRoomData {
  room_number: string;
  default_rent: number;
  capacity: number;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  "phone number": string;
  national_id: string;
  room_number: string | null;
  occupancy_start_date: string | null;
  created_at: string;
}

export interface TenantDetails extends Tenant {
  room_id: number | null;
}

export interface CheckInData {
  name?: string;
  email?: string;
  phone?: string;
  national_id?: string;
  tenant_id?: number;
  room_id: number;
  agreed_rent: number;
}

export interface Occupancy {
  id: number;
  tenant_id: number;
  tenant_name: string;
  room_id: number;
  room_number: string;
  agreed_rent: number;
  damages_or_dues: number;
  damages_reason: string | null;
  start_date: string;
  end_date: string | null;
  check_in_notes: string | null;
  check_out_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EndOccupancyData {
  damages_or_dues?: number;
  damages_reason?: string;
  check_out_notes?: string;
}

export interface Billing {
  id: number;
  tenant_id: number;
  tenant_name: string;
  occupancy_id: number;
  room_id: number;
  room_number: string;
  month: number;
  year: number;
  rent_amount: number;
  water_bill: number;
  total_amount: number;
  charge_date: string;
  created_at: string;
  updated_at: string | null;
}

export interface GenerateBillingData {
  month: number;
  year: number;
  water_bill: number;
}

export interface Payment {
  id: number;
  tenant_id: number;
  monthly_charge_id: number;
  status: "pending" | "completed" | "failed";
  amount: number;
  method: "mpesa" | "cash" | "bank";
  mpesa_receipt: string | null;
  payment_date: string;
  created_at: string;
}

export interface RecordPaymentData {
  tenant_id: number;
  monthly_charge_id: number;
  amount: number;
  method: "mpesa" | "cash" | "bank";
  mpesa_receipt?: string;
  payment_date: string;
}

export interface ArrearsReport {
  tenant_id: number;
  name: string;
  "total billed": number;
  total_paid: number;
  balance: number;
}

export interface LedgerEntry {
  type: "charge" | "payment";
  date: string;
  description: string;
  amount: number;
  balance: number;
}
