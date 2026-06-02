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
import { formatCurrency, getMonthName } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Calendar,
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

// Demo data
const monthlyIncomeData = [
  { month: "Jan", income: 285000, collected: 270000 },
  { month: "Feb", income: 295000, collected: 280000 },
  { month: "Mar", income: 310000, collected: 295000 },
  { month: "Apr", income: 305000, collected: 300000 },
  { month: "May", income: 320000, collected: 315000 },
  { month: "Jun", income: 335000, collected: 295000 },
];

const occupancyTrend = [
  { month: "Jan", rate: 68 },
  { month: "Feb", rate: 72 },
  { month: "Mar", rate: 70 },
  { month: "Apr", rate: 75 },
  { month: "May", rate: 78 },
  { month: "Jun", rate: 75 },
];

const paymentMethods = [
  { name: "M-Pesa", value: 65, color: "#22c55e" },
  { name: "Cash", value: 20, color: "#6b7280" },
  { name: "Bank", value: 15, color: "#3b82f6" },
];

const arrearsData = [
  { id: 1, tenant_name: "Peter Odhiambo", room_number: "C01", total_billed: 26850, total_paid: 2850, balance: 24000, months_overdue: 3 },
  { id: 2, tenant_name: "James Mwangi", room_number: "A03", total_billed: 38100, total_paid: 26100, balance: 12000, months_overdue: 2 },
  { id: 3, tenant_name: "Sarah Wanjiku", room_number: "B08", total_billed: 23700, total_paid: 15200, balance: 8500, months_overdue: 1 },
  { id: 4, tenant_name: "Mike Johnson", room_number: "B01", total_billed: 31650, total_paid: 21100, balance: 10550, months_overdue: 1 },
];

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const totalIncome = monthlyIncomeData.reduce((sum, d) => sum + d.income, 0);
  const totalCollected = monthlyIncomeData.reduce((sum, d) => sum + d.collected, 0);
  const collectionRate = Math.round((totalCollected / totalIncome) * 100);
  const totalArrears = arrearsData.reduce((sum, d) => sum + d.balance, 0);

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
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
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
            <CardTitle className="text-sm font-medium">Avg Occupancy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(occupancyTrend.reduce((sum, d) => sum + d.rate, 0) / occupancyTrend.length)}%
            </div>
            <p className="text-xs text-muted-foreground">This year</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate Trend</CardTitle>
            <CardDescription>Monthly occupancy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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
                  <TableHead>Room</TableHead>
                  <TableHead>Total Billed</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrearsData.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.room_number}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(tenant.total_billed)}</TableCell>
                    <TableCell className="text-success">{formatCurrency(tenant.total_paid)}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {formatCurrency(tenant.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.months_overdue >= 3 ? "destructive" : "warning"}>
                        {tenant.months_overdue} month{tenant.months_overdue > 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
