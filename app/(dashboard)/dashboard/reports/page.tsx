"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useArrears, useBillings, usePayments, useRooms } from "@/hooks/use-data";
import { formatCurrency, getMonthName } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const { token } = useAuth();
  const { data: arrears, isLoading: isLoadingArrears } = useArrears(token);
  const { data: billings, isLoading: isLoadingBillings } = useBillings(token);
  const { data: payments, isLoading: isLoadingPayments } = usePayments(token);
  const { data: rooms, isLoading: isLoadingRooms } = useRooms(token);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");

  const isLoading = isLoadingArrears || isLoadingBillings || isLoadingPayments || isLoadingRooms;

  const arrearsData = arrears || [];
  const billingsList = billings || [];
  const paymentsList = (payments || []).filter((p) => p.status === "completed");
  const roomsList = rooms || [];

  // Calculate monthly data for charts
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = parseInt(selectedYear);
  
  const monthlyIncomeData = months.slice(0, new Date().getMonth() + 1).map((month, index) => {
    const monthNum = index + 1;
    const monthBillings = billingsList.filter((b) => b.year === year && b.month === monthNum);
    const income = monthBillings.reduce((sum, b) => sum + b.total_amount, 0);
    
    const monthPayments = paymentsList.filter((p) => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === monthNum;
    });
    const collected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return { month, income, collected };
  });

  // Calculate occupancy trend
  const totalRooms = roomsList.length;
  const occupiedRooms = roomsList.filter((r) => r.status === "occupied").length;
  const currentOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Use current rate for trend (in a real app, you'd have historical data)
  const occupancyTrend = months.slice(0, new Date().getMonth() + 1).map((month) => ({
    month,
    rate: currentOccupancyRate,
  }));

  // Calculate payment methods distribution
  const mpesaPayments = paymentsList.filter((p) => p.method === "mpesa");
  const cashPayments = paymentsList.filter((p) => p.method === "cash");
  const bankPayments = paymentsList.filter((p) => p.method === "bank");
  const totalPaymentCount = paymentsList.length || 1;

  const paymentMethods = [
    { name: "M-Pesa", value: Math.round((mpesaPayments.length / totalPaymentCount) * 100), color: "#22c55e" },
    { name: "Cash", value: Math.round((cashPayments.length / totalPaymentCount) * 100), color: "#6b7280" },
    { name: "Bank", value: Math.round((bankPayments.length / totalPaymentCount) * 100), color: "#3b82f6" },
  ];

  const totalIncome = monthlyIncomeData.reduce((sum, d) => sum + d.income, 0);
  const totalCollected = monthlyIncomeData.reduce((sum, d) => sum + d.collected, 0);
  const collectionRate = totalIncome > 0 ? Math.round((totalCollected / totalIncome) * 100) : 0;
  const totalArrears = arrearsData.reduce((sum, d) => sum + d.balance, 0);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">Overview of income, collections, and arrears</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </Select>
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="all">All Months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Year to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <div className="h-3 w-3 rounded-full bg-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalCollected)}</div>
            <p className="text-xs text-muted-foreground">{collectionRate}% collection rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalIncome - totalCollected)}
            </div>
            <p className="text-xs text-muted-foreground">Pending collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentOccupancyRate}%</div>
            <p className="text-xs text-muted-foreground">{occupiedRooms} of {totalRooms} rooms</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Collection</CardTitle>
            <CardDescription>Monthly comparison of billed vs collected amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {monthlyIncomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Billed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No billing data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>Current occupancy status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {occupancyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Occupancy Rate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No occupancy data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {paymentsList.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No payment data
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: method.color }} />
                    <span>{method.name}</span>
                  </div>
                  <span className="font-medium">{method.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Arrears Report */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle>Arrears Report</CardTitle>
            </div>
            <CardDescription>
              Total outstanding: {formatCurrency(totalArrears)} from {arrearsData.length} tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Total Billed</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrearsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No tenants in arrears
                    </TableCell>
                  </TableRow>
                ) : (
                  arrearsData.map((tenant) => (
                    <TableRow key={tenant.tenant_id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{formatCurrency(tenant["total billed"])}</TableCell>
                      <TableCell className="text-success">{formatCurrency(tenant.total_paid)}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(tenant.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
