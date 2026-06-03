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
import { usePayments, useBillings, useTenants } from "@/hooks/use-data";
import { paymentsApi, Payment, Billing, Tenant } from "@/lib/api";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { Plus, Search, CreditCard, Loader2, Eye } from "lucide-react";

export default function PaymentsPage() {
  const { token } = useAuth();
  const { data: payments, isLoading: isLoadingPayments, mutate } = usePayments(token);
  const { data: billings, mutate: mutateBillings } = useBillings(token);
  const { data: tenantsRaw } = useTenants(token);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentData, setPaymentData] = useState({
    billing_id: "",
    amount: "",
    method: "mpesa",
    mpesa_receipt: "",
    payment_date: new Date().toISOString().split("T")[0],
  });

  const paymentsList = payments || [];
  const billingsList = billings || [];
  const tenants = (tenantsRaw?.filter((t): t is Tenant => typeof t !== "string") || []);

  // Calculate pending billings (unpaid or partially paid)
  const billingsWithPaymentStatus = billingsList.map((billing) => {
    const billingPayments = paymentsList.filter(
      (p) => p.monthly_charge_id === billing.id && p.status === "completed"
    );
    const totalPaid = billingPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = billing.total_amount - totalPaid;
    
    return { ...billing, totalPaid, balance };
  });

  const pendingBillings = billingsWithPaymentStatus.filter((b) => b.balance > 0);

  // Enrich payments with tenant/billing info
  const paymentsWithDetails = paymentsList.map((payment) => {
    const billing = billingsList.find((b) => b.id === payment.monthly_charge_id);
    return {
      ...payment,
      tenant_name: billing?.tenant_name || "Unknown",
      room_number: billing?.room_number || "-",
      billing_period: billing ? `${getMonthName(billing.month)} ${billing.year}` : "-",
    };
  });

  const filteredPayments = paymentsWithDetails.filter((payment) => {
    const matchesSearch =
      payment.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.mpesa_receipt && payment.mpesa_receipt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleRecordPayment = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    const billingId = selectedBillingId || parseInt(paymentData.billing_id);
    const billing = billingsWithPaymentStatus.find((b) => b.id === billingId);
    
    if (!billing) {
      setError("Please select a billing");
      setIsLoading(false);
      return;
    }

    try {
      await paymentsApi.record(
        {
          tenant_id: billing.tenant_id,
          monthly_charge_id: billing.id,
          amount: parseFloat(paymentData.amount),
          method: paymentData.method as "mpesa" | "cash" | "bank",
          mpesa_receipt: paymentData.method === "mpesa" ? paymentData.mpesa_receipt : undefined,
          payment_date: paymentData.payment_date,
        },
        token
      );

      await Promise.all([mutate(), mutateBillings()]);
      setIsRecordOpen(false);
      setSelectedBillingId(null);
      setPaymentData({
        billing_id: "",
        amount: "",
        method: "mpesa",
        mpesa_receipt: "",
        payment_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  const openRecordForBilling = (billing: typeof billingsWithPaymentStatus[0]) => {
    setSelectedBillingId(billing.id);
    setPaymentData({
      ...paymentData,
      billing_id: billing.id.toString(),
      amount: billing.balance.toString(),
    });
    setError(null);
    setIsRecordOpen(true);
  };

  const openView = (payment: typeof paymentsWithDetails[0]) => {
    setSelectedPayment(payment);
    setIsViewOpen(true);
  };

  const totalCollected = paymentsList.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const mpesaTotal = paymentsList.filter((p) => p.method === "mpesa" && p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const cashTotal = paymentsList.filter((p) => p.method === "cash" && p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const bankTotal = paymentsList.filter((p) => p.method === "bank" && p.status === "completed").reduce((sum, p) => sum + p.amount, 0);

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "mpesa":
        return <Badge className="bg-green-600">M-Pesa</Badge>;
      case "cash":
        return <Badge variant="secondary">Cash</Badge>;
      case "bank":
        return <Badge className="bg-blue-600">Bank</Badge>;
      default:
        return <Badge>{method}</Badge>;
    }
  };

  if (isLoadingPayments) {
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
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">M-Pesa</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(mpesaTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash</CardTitle>
            <div className="h-3 w-3 rounded-full bg-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cashTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank</CardTitle>
            <div className="h-3 w-3 rounded-full bg-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(bankTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Payments */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Pending Payments</CardTitle>
            <CardDescription>Outstanding balances to collect</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingBillings.map((billing) => (
                <div
                  key={billing.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{billing.tenant_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Room {billing.room_number} - {getMonthName(billing.month)} {billing.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      {formatCurrency(billing.balance)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-7 text-xs"
                      onClick={() => openRecordForBilling(billing)}
                    >
                      Record
                    </Button>
                  </div>
                </div>
              ))}
              {pendingBillings.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No pending payments
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All recorded payments</CardDescription>
              </div>
              <Button onClick={() => { setError(null); setIsRecordOpen(true); }}>
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="mpesa">M-Pesa</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </Select>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.tenant_name}</p>
                        <p className="text-xs text-muted-foreground">{payment.billing_period}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getMethodBadge(payment.method)}</TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openView(payment)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent onClose={() => { setIsRecordOpen(false); setSelectedBillingId(null); }}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedBillingId
                ? `Record payment for selected billing`
                : "Record a new payment from a tenant"}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-4 py-4">
            {!selectedBillingId && (
              <div className="space-y-2">
                <Label htmlFor="billing_id">Select Bill</Label>
                <Select
                  id="billing_id"
                  value={paymentData.billing_id}
                  onChange={(e) => {
                    const billing = pendingBillings.find((b) => b.id.toString() === e.target.value);
                    setPaymentData({ 
                      ...paymentData, 
                      billing_id: e.target.value,
                      amount: billing?.balance.toString() || ""
                    });
                  }}
                >
                  <option value="">Select a pending bill</option>
                  {pendingBillings.map((billing) => (
                    <option key={billing.id} value={billing.id}>
                      {billing.tenant_name} - Room {billing.room_number} - {formatCurrency(billing.balance)}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 8500"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                id="method"
                value={paymentData.method}
                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
              >
                <option value="mpesa">M-Pesa</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </Select>
            </div>
            {paymentData.method === "mpesa" && (
              <div className="space-y-2">
                <Label htmlFor="mpesa_receipt">M-Pesa Receipt Number</Label>
                <Input
                  id="mpesa_receipt"
                  placeholder="e.g., QK7GHRJPQK"
                  value={paymentData.mpesa_receipt}
                  onChange={(e) => setPaymentData({ ...paymentData, mpesa_receipt: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsRecordOpen(false); setSelectedBillingId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent onClose={() => setIsViewOpen(false)}>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Tenant</p>
                  <p className="font-medium">{(selectedPayment as typeof paymentsWithDetails[0]).tenant_name}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="font-medium">{(selectedPayment as typeof paymentsWithDetails[0]).room_number}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Method</p>
                  {getMethodBadge(selectedPayment.method)}
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedPayment.payment_date)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Billing Period</p>
                  <p className="font-medium">{(selectedPayment as typeof paymentsWithDetails[0]).billing_period}</p>
                </div>
              </div>
              {selectedPayment.mpesa_receipt && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">M-Pesa Receipt</p>
                  <p className="font-mono font-medium">{selectedPayment.mpesa_receipt}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={selectedPayment.status === "completed" ? "success" : "secondary"}>
                  {selectedPayment.status}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
