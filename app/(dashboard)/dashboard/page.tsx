"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  DoorOpen,
  Users,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency, getMonthName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Demo data - in real app this would come from API
const stats = [
  {
    name: "Total Rooms",
    value: "24",
    change: "+2",
    changeType: "positive" as const,
    icon: DoorOpen,
  },
  {
    name: "Active Tenants",
    value: "18",
    change: "+3",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    name: "Pending Bills",
    value: "KES 45,000",
    change: "-12%",
    changeType: "negative" as const,
    icon: Receipt,
  },
  {
    name: "Monthly Income",
    value: "KES 320,000",
    change: "+8%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const recentActivity = [
  { id: 1, type: "payment", message: "Payment received from John Doe", time: "2 hours ago", amount: 15000 },
  { id: 2, type: "checkin", message: "New tenant Jane Smith checked in", time: "5 hours ago", room: "A12" },
  { id: 3, type: "billing", message: "Monthly bills generated for June", time: "1 day ago", count: 18 },
  { id: 4, type: "checkout", message: "Tenant Mike Johnson checked out", time: "2 days ago", room: "B05" },
];

const occupancyData = [
  { status: "Occupied", count: 18, color: "bg-primary" },
  { status: "Available", count: 4, color: "bg-success" },
  { status: "Maintenance", count: 2, color: "bg-warning" },
];

const arrears = [
  { id: 1, name: "James Mwangi", room: "A03", amount: 12000, months: 2 },
  { id: 2, name: "Sarah Wanjiku", room: "B08", amount: 8500, months: 1 },
  { id: 3, name: "Peter Odhiambo", room: "C11", amount: 24000, months: 3 },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const currentMonth = getMonthName(new Date().getMonth() + 1);
  const currentYear = new Date().getFullYear();

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
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="flex items-center text-xs text-muted-foreground">
                {stat.changeType === "positive" ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span
                  className={cn(
                    stat.changeType === "positive" ? "text-success" : "text-destructive"
                  )}
                >
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
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
                        style={{ width: `${(item.count / 24) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div>
                <p className="text-sm font-medium">Occupancy Rate</p>
                <p className="text-2xl font-bold text-primary">75%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">18 of 24 rooms</p>
                <p className="text-xs text-muted-foreground">currently occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div
                    className={cn(
                      "mt-1 h-2 w-2 rounded-full",
                      activity.type === "payment"
                        ? "bg-success"
                        : activity.type === "checkin"
                        ? "bg-primary"
                        : activity.type === "billing"
                        ? "bg-warning"
                        : "bg-muted-foreground"
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.amount && (
                    <Badge variant="secondary">{formatCurrency(activity.amount)}</Badge>
                  )}
                  {activity.room && <Badge variant="outline">Room {activity.room}</Badge>}
                </div>
              ))}
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
              {arrears.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-lg bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-warning font-semibold">
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Room {tenant.room} - {tenant.months} month{tenant.months > 1 ? "s" : ""} overdue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-destructive">
                      {formatCurrency(tenant.amount)}
                    </p>
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
