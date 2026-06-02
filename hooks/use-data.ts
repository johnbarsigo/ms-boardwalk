"use client";

import useSWR from "swr";
import {
  roomsApi,
  tenantsApi,
  billingsApi,
  paymentsApi,
  reportsApi,
  usersApi,
  occupanciesApi,
  Room,
  Tenant,
  Billing,
  Payment,
  ArrearsReport,
  User,
  Occupancy,
} from "@/lib/api";

// Generic fetcher that uses the token from the hook
const createFetcher = <T>(apiFn: (token: string) => Promise<T>) => {
  return async (key: string, token: string): Promise<T> => {
    if (!token) throw new Error("No authentication token");
    return apiFn(token);
  };
};

// Rooms
export function useRooms(token: string | null) {
  return useSWR<Room[]>(
    token ? ["rooms", token] : null,
    ([, t]) => roomsApi.getAll(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// Tenants
export function useTenants(token: string | null) {
  return useSWR<(Tenant | string)[]>(
    token ? ["tenants", token] : null,
    ([, t]) => tenantsApi.getAll(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// Billings
export function useBillings(token: string | null) {
  return useSWR<Billing[]>(
    token ? ["billings", token] : null,
    ([, t]) => billingsApi.getAll(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// Payments
export function usePayments(token: string | null) {
  return useSWR<Payment[]>(
    token ? ["payments", token] : null,
    ([, t]) => paymentsApi.getAll(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// Arrears Report
export function useArrears(token: string | null) {
  return useSWR<ArrearsReport[]>(
    token ? ["arrears", token] : null,
    ([, t]) => reportsApi.getArrears(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );
}

// Users (admin only)
export function useUsers(token: string | null, isAdmin: boolean) {
  return useSWR<User[]>(
    token && isAdmin ? ["users", token] : null,
    ([, t]) => usersApi.getAll(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// Occupancies
export function useOccupancies(token: string | null) {
  return useSWR<Occupancy[]>(
    token ? ["occupancies", token] : null,
    ([, t]) => occupanciesApi.getAll(t as string),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// Dashboard stats (aggregated from multiple sources)
export function useDashboardStats(token: string | null) {
  const { data: rooms, isLoading: roomsLoading } = useRooms(token);
  const { data: tenantsRaw, isLoading: tenantsLoading } = useTenants(token);
  const { data: billings, isLoading: billingsLoading } = useBillings(token);
  const { data: payments, isLoading: paymentsLoading } = usePayments(token);
  const { data: arrears, isLoading: arrearsLoading } = useArrears(token);

  // Filter out string messages from tenants array
  const tenants = tenantsRaw?.filter((t): t is Tenant => typeof t !== "string") || [];

  const isLoading = roomsLoading || tenantsLoading || billingsLoading || paymentsLoading || arrearsLoading;

  // Calculate stats
  const totalRooms = rooms?.length || 0;
  const occupiedRooms = rooms?.filter((r) => r.status === "occupied").length || 0;
  const availableRooms = rooms?.filter((r) => r.status === "available").length || 0;
  const activeTenants = tenants.filter((t) => t.room_number !== null).length;

  // Current month billings
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyBillings = billings?.filter(
    (b) => b.month === currentMonth && b.year === currentYear
  ) || [];
  const totalBilled = monthlyBillings.reduce((sum, b) => sum + b.total_amount, 0);

  // Current month payments
  const monthlyPayments = payments?.filter((p) => {
    const paymentDate = new Date(p.payment_date);
    return paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear;
  }) || [];
  const totalCollected = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Pending bills (unpaid)
  const pendingBills = totalBilled - totalCollected;

  return {
    isLoading,
    stats: {
      totalRooms,
      occupiedRooms,
      availableRooms,
      activeTenants,
      totalBilled,
      totalCollected,
      pendingBills,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    },
    rooms: rooms || [],
    tenants,
    billings: billings || [],
    payments: payments || [],
    arrears: arrears || [],
  };
}
