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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Edit, Eye, UserPlus, LogOut as LogOutIcon, Users, Loader2 } from "lucide-react";

// Demo data
const demoTenants = [
  { id: 1, name: "John Doe", email: "john@email.com", phone: "0712345678", national_id: "12345678", room_number: "A01", occupancy_start_date: "2024-01-15", status: "active" },
  { id: 2, name: "Jane Smith", email: "jane@email.com", phone: "0723456789", national_id: "23456789", room_number: "A03", occupancy_start_date: "2024-02-01", status: "active" },
  { id: 3, name: "Mike Johnson", email: "mike@email.com", phone: "0734567890", national_id: "34567890", room_number: "B01", occupancy_start_date: "2024-02-15", status: "active" },
  { id: 4, name: "Sarah Wanjiku", email: "sarah@email.com", phone: "0745678901", national_id: "45678901", room_number: "B03", occupancy_start_date: "2024-03-01", status: "active" },
  { id: 5, name: "Peter Odhiambo", email: "peter@email.com", phone: "0756789012", national_id: "56789012", room_number: "C01", occupancy_start_date: "2024-03-15", status: "active" },
  { id: 6, name: "Mary Njeri", email: "mary@email.com", phone: "0767890123", national_id: "67890123", room_number: null, occupancy_start_date: null, status: "past" },
];

const availableRooms = [
  { id: 2, room_number: "A02", default_rent: 8000 },
  { id: 5, room_number: "B02", default_rent: 10000 },
  { id: 8, room_number: "C02", default_rent: 8500 },
];

type Tenant = typeof demoTenants[0];

export default function TenantsPage() {
  const { isAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>(demoTenants);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "past">("all");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    national_id: "",
    room_id: "",
    agreed_rent: "",
  });

  const [checkOutData, setCheckOutData] = useState({
    damages_or_dues: "",
    damages_reason: "",
    check_out_notes: "",
  });

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.national_id.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCheckIn = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const room = availableRooms.find((r) => r.id.toString() === formData.room_id);
    const newTenant: Tenant = {
      id: tenants.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      national_id: formData.national_id,
      room_number: room?.room_number || null,
      occupancy_start_date: new Date().toISOString().split("T")[0],
      status: "active",
    };

    setTenants([newTenant, ...tenants]);
    setIsCheckInOpen(false);
    setFormData({ name: "", email: "", phone: "", national_id: "", room_id: "", agreed_rent: "" });
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedTenant) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setTenants(tenants.map((t) =>
      t.id === selectedTenant.id
        ? { ...t, name: formData.name, email: formData.email, phone: formData.phone, national_id: formData.national_id }
        : t
    ));

    setIsEditOpen(false);
    setSelectedTenant(null);
    setIsLoading(false);
  };

  const handleCheckOut = async () => {
    if (!selectedTenant) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setTenants(tenants.map((t) =>
      t.id === selectedTenant.id
        ? { ...t, status: "past", room_number: null }
        : t
    ));

    setIsCheckOutOpen(false);
    setSelectedTenant(null);
    setCheckOutData({ damages_or_dues: "", damages_reason: "", check_out_notes: "" });
    setIsLoading(false);
  };

  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      national_id: tenant.national_id,
      room_id: "",
      agreed_rent: "",
    });
    setIsEditOpen(true);
  };

  const openView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsViewOpen(true);
  };

  const openCheckOut = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsCheckOutOpen(true);
  };

  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const pastTenants = tenants.filter((t) => t.status === "past").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <div className="h-3 w-3 rounded-full bg-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Tenants</CardTitle>
            <div className="h-3 w-3 rounded-full bg-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{pastTenants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Manage all tenants and their occupancies</CardDescription>
            </div>
            <Button onClick={() => setIsCheckInOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Check In Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "past" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("past")}
              >
                Past
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-in Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{tenant.phone}</TableCell>
                  <TableCell>{tenant.national_id}</TableCell>
                  <TableCell>
                    {tenant.room_number ? (
                      <Badge variant="outline">{tenant.room_number}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.occupancy_start_date ? formatDate(tenant.occupancy_start_date) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === "active" ? "success" : "secondary"}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(tenant)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {tenant.status === "active" && (
                        <Button variant="ghost" size="icon" onClick={() => openCheckOut(tenant)}>
                          <LogOutIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No tenants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Check In Dialog */}
      <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
        <DialogContent onClose={() => setIsCheckInOpen(false)}>
          <DialogHeader>
            <DialogTitle>Check In New Tenant</DialogTitle>
            <DialogDescription>Register a new tenant and assign them a room.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="0712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID</Label>
                <Input
                  id="national_id"
                  placeholder="12345678"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room_id">Assign Room</Label>
                <Select
                  id="room_id"
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                >
                  <option value="">Select a room</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {formatCurrency(room.default_rent)}/month
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreed_rent">Agreed Rent (KES)</Label>
                <Input
                  id="agreed_rent"
                  type="number"
                  placeholder="8000"
                  value={formData.agreed_rent}
                  onChange={(e) => setFormData({ ...formData, agreed_rent: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckInOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check In Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent onClose={() => setIsEditOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update tenant information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Full Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone Number</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_national_id">National ID</Label>
              <Input
                id="edit_national_id"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              />
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

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent onClose={() => setIsViewOpen(false)}>
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                  {selectedTenant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedTenant.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTenant.email}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedTenant.phone}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">National ID</p>
                  <p className="font-medium">{selectedTenant.national_id}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="font-medium">{selectedTenant.room_number || "Not assigned"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Check-in Date</p>
                  <p className="font-medium">
                    {selectedTenant.occupancy_start_date
                      ? formatDate(selectedTenant.occupancy_start_date)
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={selectedTenant.status === "active" ? "success" : "secondary"}>
                  {selectedTenant.status}
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

      {/* Check Out Dialog */}
      <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
        <DialogContent onClose={() => setIsCheckOutOpen(false)}>
          <DialogHeader>
            <DialogTitle>Check Out Tenant</DialogTitle>
            <DialogDescription>
              End occupancy for {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="damages">Damages or Dues (KES)</Label>
              <Input
                id="damages"
                type="number"
                placeholder="0"
                value={checkOutData.damages_or_dues}
                onChange={(e) => setCheckOutData({ ...checkOutData, damages_or_dues: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="damages_reason">Reason for Damages/Dues</Label>
              <Input
                id="damages_reason"
                placeholder="Optional"
                value={checkOutData.damages_reason}
                onChange={(e) => setCheckOutData({ ...checkOutData, damages_reason: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout_notes">Check-out Notes</Label>
              <Input
                id="checkout_notes"
                placeholder="Optional notes"
                value={checkOutData.check_out_notes}
                onChange={(e) => setCheckOutData({ ...checkOutData, check_out_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckOutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCheckOut} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Check Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
