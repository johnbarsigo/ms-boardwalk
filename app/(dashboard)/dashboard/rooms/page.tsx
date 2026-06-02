"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, DoorOpen, Users, Loader2 } from "lucide-react";

// Demo data - in real app would come from API
const demoRooms = [
  { id: 1, room_number: "A01", default_rent: 8000, capacity: 1, status: "occupied", current_occupants: 1, created_at: "2024-01-15" },
  { id: 2, room_number: "A02", default_rent: 8000, capacity: 1, status: "available", current_occupants: 0, created_at: "2024-01-15" },
  { id: 3, room_number: "A03", default_rent: 12000, capacity: 2, status: "occupied", current_occupants: 2, created_at: "2024-01-15" },
  { id: 4, room_number: "B01", default_rent: 10000, capacity: 1, status: "occupied", current_occupants: 1, created_at: "2024-02-01" },
  { id: 5, room_number: "B02", default_rent: 10000, capacity: 1, status: "available", current_occupants: 0, created_at: "2024-02-01" },
  { id: 6, room_number: "B03", default_rent: 15000, capacity: 2, status: "occupied", current_occupants: 1, created_at: "2024-02-01" },
  { id: 7, room_number: "C01", default_rent: 8500, capacity: 1, status: "occupied", current_occupants: 1, created_at: "2024-03-01" },
  { id: 8, room_number: "C02", default_rent: 8500, capacity: 1, status: "available", current_occupants: 0, created_at: "2024-03-01" },
];

type Room = typeof demoRooms[0];

export default function RoomsPage() {
  const { isAdmin } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(demoRooms);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "occupied">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    room_number: "",
    default_rent: "",
    capacity: "1",
  });

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newRoom: Room = {
      id: rooms.length + 1,
      room_number: formData.room_number,
      default_rent: parseFloat(formData.default_rent),
      capacity: parseInt(formData.capacity),
      status: "available",
      current_occupants: 0,
      created_at: new Date().toISOString().split("T")[0],
    };
    
    setRooms([...rooms, newRoom]);
    setIsCreateOpen(false);
    setFormData({ room_number: "", default_rent: "", capacity: "1" });
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedRoom) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setRooms(rooms.map((r) =>
      r.id === selectedRoom.id
        ? {
            ...r,
            room_number: formData.room_number,
            default_rent: parseFloat(formData.default_rent),
            capacity: parseInt(formData.capacity),
          }
        : r
    ));
    
    setIsEditOpen(false);
    setSelectedRoom(null);
    setIsLoading(false);
  };

  const handleDelete = async (room: Room) => {
    if (room.status === "occupied") {
      alert("Cannot delete occupied room");
      return;
    }
    if (confirm(`Delete room ${room.room_number}?`)) {
      setRooms(rooms.filter((r) => r.id !== room.id));
    }
  };

  const openEdit = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      room_number: room.room_number,
      default_rent: room.default_rent.toString(),
      capacity: room.capacity.toString(),
    });
    setIsEditOpen(true);
  };

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-3 w-3 rounded-full bg-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{availableRooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{occupiedRooms}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Rooms</CardTitle>
              <CardDescription>Manage all rooms in your hostel</CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
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
                variant={statusFilter === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("available")}
              >
                Available
              </Button>
              <Button
                variant={statusFilter === "occupied" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("occupied")}
              >
                Occupied
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Default Rent</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Occupants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.room_number}</TableCell>
                  <TableCell>{formatCurrency(room.default_rent)}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.current_occupants}/{room.capacity}</TableCell>
                  <TableCell>
                    <Badge variant={room.status === "available" ? "success" : "default"}>
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(room)}
                          disabled={room.status === "occupied"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No rooms found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Room Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a new room in your hostel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                placeholder="e.g., A01"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_rent">Default Rent (KES)</Label>
              <Input
                id="default_rent"
                type="number"
                placeholder="e.g., 8000"
                value={formData.default_rent}
                onChange={(e) => setFormData({ ...formData, default_rent: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="e.g., 1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent onClose={() => setIsEditOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_room_number">Room Number</Label>
              <Input
                id="edit_room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_default_rent">Default Rent (KES)</Label>
              <Input
                id="edit_default_rent"
                type="number"
                value={formData.default_rent}
                onChange={(e) => setFormData({ ...formData, default_rent: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_capacity">Capacity</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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
    </div>
  );
}
