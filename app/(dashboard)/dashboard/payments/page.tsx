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
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { Plus, Search, CreditCard, TrendingUp, Loader2, Eye } from "lucide-react";

// Demo data
const demoPayments = [
  { id: 1, tenant_id: 1, tenant_name: "John Doe", room_number: "A01", amount: 8500, method: "mpesa", mpesa_receipt: "QK7GHRJPQK", payment_date: "2024-06-05", status: "completed", billing_period: "June 2024" },
  { id: 2, tenant_id: 4, tenant_name: "Sarah Wanjiku", room_number: "B03", amount: 15800, method: "bank", mpesa_receipt: null, payment_date: "2024-06-03", status: "completed", billing_period: "June 2024" },
  { id: 3, tenant_id: 2, tenant_name: "Jane Smith", room_number: "A03", amount: 6000, method: "cash", mpesa_receipt: null, payment_date: "2024-06-10", status: "completed", billing_period: "June 2024" },
  { id: 4, tenant_id: 1, tenant_name: "John Doe", room_number: "A01", amount: 8480, method: "mpesa", mpesa_receipt: "QK7ABCDEFG", payment_date: "2024-05-04", status: "completed", billing_period: "May 2024" },
  { id: 5, tenant_id: 2, tenant_name: "Jane Smith", room_number: "A03", amount: 12650, method: "mpesa", mpesa_receipt: "QK7HIJKLMN", payment_date: "2024-05-06", status: "completed", billing_period: "May 2024" },
];

const pendingBillings = [
  { id: 3, tenant_id: 3, tenant_name: "Mike Johnson", room_number: "B01", total_amount: 10550, billing_period: "June 2024" },
  { id: 5, tenant_id: 5, tenant_name: "Peter Odhiambo", room_number: "C01", total_amount: 8950, billing_period: "June 2024" },
  { id: 2, tenant_id: 2, tenant_name: "Jane Smith", room_number: "A03", total_amount: 6700, billing_period: "June 2024 (Balance)" },
];

type Payment = typeof demoPayments[0];
type PendingBilling = typeof pendingBillings[0];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(demoPayments);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<PendingBilling | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [paymentData, setPaymentData] = useState({
    billing_id: "",
    amount: "",
    method: "mpesa",
    mpesa_receipt: "",
    payment_date: new Date().toISOString().split("T")[0],
  });

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.mpesa_receipt && payment.mpesa_receipt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleRecordPayment = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const billing = selectedBilling || pendingBillings.find((b) => b.id.toString() === paymentData.billing_id);
    if (!billing) return;

    const newPayment: Payment = {
      id: payments.length + 1,
      tenant_id: billing.tenant_id,
      tenant_name: billing.tenant_name,
      room_number: billing.room_number,
      amount: parseFloat(paymentData.amount),
      method: paymentData.method as "mpesa" | "cash" | "bank",
      mpesa_receipt: paymentData.method === "mpesa" ? paymentData.mpesa_receipt : null,
      payment_date: paymentData.payment_date,
      status: "completed",
      billing_period: billing.billing_period,
    };

    setPayments([newPayment, ...payments]);
    setIsRecordOpen(false);
    setSelectedBilling(null);
    setPaymentData({
      billing_id: "",
      amount: "",
      method: "mpesa",
      mpesa_receipt: "",
      payment_date: new Date().toISOString().split("T")[0],
    });
    setIsLoading(false);
  };

  const openRecordForBilling = (billing: PendingBilling) => {
    setSelectedBilling(billing);
    setPaymentData({
      ...paymentData,
      billing_id: billing.id.toString(),
      amount: billing.total_amount.toString(),
    });
    setIsRecordOpen(true);
  };

  const openView = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewOpen(true);
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const mpesaTotal = payments.filter((p) => p.method === "mpesa").reduce((sum, p) => sum + p.amount, 0);
  const cashTotal = payments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
  const bankTotal = payments.filter((p) => p.method === "bank").reduce((sum, p) => sum + p.amount, 0);

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
                      Room {billing.room_number} - {billing.billing_period}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      {formatCurrency(billing.total_amount)}
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
              <Button onClick={() => setIsRecordOpen(true)}>
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
        <DialogContent onClose={() => { setIsRecordOpen(false); setSelectedBilling(null); }}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedBilling
                ? `Record payment for ${selectedBilling.tenant_name}`
                : "Record a new payment from a tenant"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedBilling && (
              <div className="space-y-2">
                <Label htmlFor="billing_id">Select Bill</Label>
                <Select
                  id="billing_id"
                  value={paymentData.billing_id}
                  onChange={(e) => setPaymentData({ ...paymentData, billing_id: e.target.value })}
                >
                  <option value="">Select a pending bill</option>
                  {pendingBillings.map((billing) => (
                    <option key={billing.id} value={billing.id}>
                      {billing.tenant_name} - Room {billing.room_number} - {formatCurrency(billing.total_amount)}
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
                <option value="bank">Bank Transfer</option>
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
            <Button variant="outline" onClick={() => { setIsRecordOpen(false); setSelectedBilling(null); }}>
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
                  <p className="font-medium">{selectedPayment.tenant_name}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="font-medium">{selectedPayment.room_number}</p>
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
                  <p className="font-medium">{selectedPayment.billing_period}</p>
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
                <Badge variant="success">Completed</Badge>
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
