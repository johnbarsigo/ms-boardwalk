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
import { useTenants, useRooms, useOccupancies } from "@/hooks/use-data";
import { tenantsApi, occupanciesApi, Tenant } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Edit, Eye, UserPlus, LogOut as LogOutIcon, Users, Loader2 } from "lucide-react";

export default function TenantsPage() {
  const { token, isAdmin } = useAuth();
  const { data: tenantsRaw, isLoading: isLoadingTenants, mutate: mutateTenants } = useTenants(token);
  const { data: rooms, mutate: mutateRooms } = useRooms(token);
  const { data: occupancies, mutate: mutateOccupancies } = useOccupancies(token);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "past">("all");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedOccupancyId, setSelectedOccupancyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Filter out string messages from tenants array
  const tenants = (tenantsRaw?.filter((t): t is Tenant => typeof t !== "string") || []);
  
  // Available rooms for check-in
  const availableRooms = (rooms || []).filter((r) => r.status === "available");

  // Determine tenant status based on room_number
  const tenantsWithStatus = tenants.map((tenant) => ({
    ...tenant,
    status: tenant.room_number ? "active" : "past",
  }));

  const filteredTenants = tenantsWithStatus.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.national_id.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCheckIn = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const room = availableRooms.find((r) => r.id.toString() === formData.room_id);
      
      await tenantsApi.checkIn(
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          national_id: formData.national_id,
          room_id: parseInt(formData.room_id),
          agreed_rent: parseFloat(formData.agreed_rent) || room?.default_rent || 0,
        },
        token
      );

      await Promise.all([mutateTenants(), mutateRooms(), mutateOccupancies()]);
      setIsCheckInOpen(false);
      setFormData({ name: "", email: "", phone: "", national_id: "", room_id: "", agreed_rent: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in tenant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTenant || !token) return;
    setIsLoading(true);
    setError(null);

    try {
      await tenantsApi.update(
        selectedTenant.id,
        {
          name: formData.name,
          email: formData.email,
          "phone number": formData.phone,
          national_id: formData.national_id,
        },
        token
      );

      await mutateTenants();
      setIsEditOpen(false);
      setSelectedTenant(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedOccupancyId || !token) return;
    setIsLoading(true);
    setError(null);

    try {
      await occupanciesApi.end(
        selectedOccupancyId,
        {
          damages_or_dues: checkOutData.damages_or_dues ? parseFloat(checkOutData.damages_or_dues) : undefined,
          damages_reason: checkOutData.damages_reason || undefined,
          check_out_notes: checkOutData.check_out_notes || undefined,
        },
        token
      );

      await Promise.all([mutateTenants(), mutateRooms(), mutateOccupancies()]);
      setIsCheckOutOpen(false);
      setSelectedTenant(null);
      setSelectedOccupancyId(null);
      setCheckOutData({ damages_or_dues: "", damages_reason: "", check_out_notes: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check out tenant");
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant["phone number"],
      national_id: tenant.national_id,
      room_id: "",
      agreed_rent: "",
    });
    setError(null);
    setIsEditOpen(true);
  };

  const openView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsViewOpen(true);
  };

  const openCheckOut = (tenant: Tenant) => {
    // Find the active occupancy for this tenant
    const activeOccupancy = (occupancies || []).find(
      (o) => o.tenant_id === tenant.id && o.end_date === null
    );
    
    if (activeOccupancy) {
      setSelectedTenant(tenant);
      setSelectedOccupancyId(activeOccupancy.id);
      setError(null);
      setIsCheckOutOpen(true);
    } else {
      alert("Could not find active occupancy for this tenant");
    }
  };

  const activeTenants = tenantsWithStatus.filter((t) => t.status === "active").length;
  const pastTenants = tenantsWithStatus.filter((t) => t.status === "past").length;

  if (isLoadingTenants) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button onClick={() => { setError(null); setIsCheckInOpen(true); }}>
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
                  <TableCell>{tenant["phone number"]}</TableCell>
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
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
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
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
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
                  <p className="font-medium">{selectedTenant["phone number"]}</p>
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
              End the occupancy for {selectedTenant?.name}. This will mark the room as available.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="damages">Damages/Outstanding Dues (KES)</Label>
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
                placeholder="e.g., Broken window"
                value={checkOutData.damages_reason}
                onChange={(e) => setCheckOutData({ ...checkOutData, damages_reason: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_notes">Check-out Notes</Label>
              <Input
                id="check_out_notes"
                placeholder="Any additional notes..."
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
