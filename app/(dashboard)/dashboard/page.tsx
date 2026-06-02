"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardStats, usePayments } from "@/hooks/use-data";
import {
  DoorOpen,
  Users,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency, getMonthName, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user, token, isAdmin } = useAuth();
  const { isLoading, stats, rooms, arrears, payments } = useDashboardStats(token);
  
  const currentMonth = getMonthName(new Date().getMonth() + 1);
  const currentYear = new Date().getFullYear();

  // Get recent payments for activity feed
  const recentPayments = payments
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, 5);

  // Occupancy breakdown
  const occupancyData = [
    { status: "Occupied", count: stats.occupiedRooms, color: "bg-primary" },
    { status: "Available", count: stats.availableRooms, color: "bg-success" },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.username}
        </h2>
        <p className="text-muted-foreground">
          {"Here's an overview of your hostel for"} {currentMonth} {currentYear}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rooms
            </CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="flex items-center text-xs text-muted-foreground">
              <span>{stats.availableRooms} available</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tenants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTenants}</div>
            <p className="flex items-center text-xs text-muted-foreground">
              <span>Currently housed</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Bills
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingBills)}</div>
            <p className="flex items-center text-xs text-muted-foreground">
              {stats.pendingBills > 0 ? (
                <>
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                  <span className="text-destructive">Outstanding</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                  <span className="text-success">All paid</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</div>
            <p className="flex items-center text-xs text-muted-foreground">
              <span>of {formatCurrency(stats.totalBilled)} billed</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Overview</CardTitle>
            <CardDescription>Current room status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupancyData.map((item) => (
                <div key={item.status} className="flex items-center gap-4">
                  <div className={cn("h-3 w-3 rounded-full", item.color)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.status}</span>
                      <span className="text-sm text-muted-foreground">{item.count} rooms</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div
                        className={cn("h-2 rounded-full", item.color)}
                        style={{ width: `${stats.totalRooms > 0 ? (item.count / stats.totalRooms) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div>
                <p className="text-sm font-medium">Occupancy Rate</p>
                <p className="text-2xl font-bold text-primary">{stats.occupancyRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{stats.occupiedRooms} of {stats.totalRooms} rooms</p>
                <p className="text-xs text-muted-foreground">currently occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent payments</p>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-start gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-success" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Payment #{payment.id} - {payment.method.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    <Badge variant="secondary">{formatCurrency(payment.amount)}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrears Alert */}
      {isAdmin && arrears.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle>Tenants in Arrears</CardTitle>
            </div>
            <CardDescription>
              {arrears.length} tenants have outstanding balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {arrears.slice(0, 5).map((tenant) => (
                <div
                  key={tenant.tenant_id}
                  className="flex items-center justify-between rounded-lg bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-warning font-semibold">
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Billed: {formatCurrency(tenant["total billed"])} | Paid: {formatCurrency(tenant.total_paid)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-destructive">
                      {formatCurrency(tenant.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">outstanding</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
