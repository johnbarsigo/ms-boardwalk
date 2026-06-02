"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useBillings, usePayments } from "@/hooks/use-data";
import { billingsApi, Billing } from "@/lib/api";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Plus, Search, Receipt, TrendingUp, Loader2, Edit, Trash2 } from "lucide-react";

export default function BillingsPage() {
  const { token, isAdmin } = useAuth();
  const { data: billings, isLoading: isLoadingBillings, mutate } = useBillings(token);
  const { data: payments } = usePayments(token);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [generateData, setGenerateData] = useState({
    month: currentMonth.toString(),
    year: currentYear.toString(),
    water_bill: "",
  });

  const [editData, setEditData] = useState({
    rent_amount: "",
    water_bill: "",
  });

  const billingsList = billings || [];
  const paymentsList = payments || [];

  // Calculate payment status for each billing
  const billingsWithStatus = billingsList.map((billing) => {
    const billingPayments = paymentsList.filter(
      (p) => p.monthly_charge_id === billing.id && p.status === "completed"
    );
    const totalPaid = billingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    let status: "paid" | "partial" | "unpaid" = "unpaid";
    if (totalPaid >= billing.total_amount) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    }
    
    return { ...billing, status, totalPaid };
  });

  const filteredBillings = billingsWithStatus.filter((billing) => {
    const matchesSearch =
      billing.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      billing.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = monthFilter === "all" || billing.month.toString() === monthFilter;
    const matchesStatus = statusFilter === "all" || billing.status === statusFilter;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  const handleGenerate = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      await billingsApi.generate(
        {
          month: parseInt(generateData.month),
          year: parseInt(generateData.year),
          water_bill: parseFloat(generateData.water_bill) || 0,
        },
        token
      );

      await mutate();
      setIsGenerateOpen(false);
      setGenerateData({ month: currentMonth.toString(), year: currentYear.toString(), water_bill: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate bills");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedBilling || !token) return;
    setIsLoading(true);
    setError(null);

    try {
      await billingsApi.update(
        selectedBilling.id,
        {
          rent_amount: parseFloat(editData.rent_amount),
          water_bill: parseFloat(editData.water_bill),
          total_amount: parseFloat(editData.rent_amount) + parseFloat(editData.water_bill),
        },
        token
      );

      await mutate();
      setIsEditOpen(false);
      setSelectedBilling(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update billing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (billing: Billing) => {
    if (!token) return;
    
    if (confirm(`Delete billing for ${billing.tenant_name}?`)) {
      try {
        await billingsApi.delete(billing.id, token);
        await mutate();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete billing");
      }
    }
  };

  const openEdit = (billing: Billing) => {
    setSelectedBilling(billing);
    setEditData({
      rent_amount: billing.rent_amount.toString(),
      water_bill: billing.water_bill.toString(),
    });
    setError(null);
    setIsEditOpen(true);
  };

  const totalBilled = filteredBillings.reduce((sum, b) => sum + b.total_amount, 0);
  const paidBillings = filteredBillings.filter((b) => b.status === "paid");
  const totalPaid = paidBillings.reduce((sum, b) => sum + b.total_amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "partial":
        return <Badge variant="warning">Partial</Badge>;
      case "unpaid":
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoadingBillings) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBillings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <div className="h-3 w-3 rounded-full bg-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <div className="h-3 w-3 rounded-full bg-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalBilled - totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billings Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Monthly Bills</CardTitle>
              <CardDescription>Manage and generate monthly billings</CardDescription>
            </div>
            <Button onClick={() => { setError(null); setIsGenerateOpen(true); }}>
              <Plus className="h-4 w-4" />
              Generate Bills
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tenant or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBillings.map((billing) => (
                <TableRow key={billing.id}>
                  <TableCell className="font-medium">{billing.tenant_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{billing.room_number}</Badge>
                  </TableCell>
                  <TableCell>
                    {getMonthName(billing.month)} {billing.year}
                  </TableCell>
                  <TableCell>{formatCurrency(billing.rent_amount)}</TableCell>
                  <TableCell>{formatCurrency(billing.water_bill)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(billing.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(billing.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(billing)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(billing)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBillings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No billings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Bills Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent onClose={() => setIsGenerateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Generate Monthly Bills</DialogTitle>
            <DialogDescription>
              Generate bills for all active occupancies for the selected month.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select
                  id="month"
                  value={generateData.month}
                  onChange={(e) => setGenerateData({ ...generateData, month: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  id="year"
                  value={generateData.year}
                  onChange={(e) => setGenerateData({ ...generateData, year: e.target.value })}
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="water_bill">Water Bill per Tenant (KES)</Label>
              <Input
                id="water_bill"
                type="number"
                placeholder="e.g., 500"
                value={generateData.water_bill}
                onChange={(e) => setGenerateData({ ...generateData, water_bill: e.target.value })}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium">This will:</p>
              <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                <li>Generate bills for all active tenants</li>
                <li>Use each tenant&apos;s agreed rent amount</li>
                <li>Apply the specified water bill to all</li>
                <li>Skip tenants who already have bills for this period</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Bills"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Billing Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent onClose={() => setIsEditOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Billing</DialogTitle>
            <DialogDescription>
              Update billing for {selectedBilling?.tenant_name}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_rent">Rent Amount (KES)</Label>
              <Input
                id="edit_rent"
                type="number"
                value={editData.rent_amount}
                onChange={(e) => setEditData({ ...editData, rent_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_water">Water Bill (KES)</Label>
              <Input
                id="edit_water"
                type="number"
                value={editData.water_bill}
                onChange={(e) => setEditData({ ...editData, water_bill: e.target.value })}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">New Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  (parseFloat(editData.rent_amount) || 0) + (parseFloat(editData.water_bill) || 0)
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
