"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { Building2, Moon, Sun, Monitor, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [hostelData, setHostelData] = useState({
    name: "Boardwalk Hostel",
    address: "123 Main Street, Nairobi",
    phone: "+254 700 000 000",
    email: "info@boardwalk.com",
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // In real app, this would call the API
    setIsLoading(false);
    alert("Profile updated successfully");
  };

  const handleSaveHostel = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // In real app, this would call the API
    setIsLoading(false);
    alert("Hostel settings updated successfully");
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="flex-1"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-4 text-sm font-medium">Change Password</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={profileData.currentPassword}
                    onChange={(e) =>
                      setProfileData({ ...profileData, currentPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={profileData.newPassword}
                    onChange={(e) =>
                      setProfileData({ ...profileData, newPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) =>
                      setProfileData({ ...profileData, confirmPassword: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hostel Settings (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Hostel Settings</CardTitle>
            </div>
            <CardDescription>Configure hostel information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hostelName">Hostel Name</Label>
                  <Input
                    id="hostelName"
                    value={hostelData.name}
                    onChange={(e) => setHostelData({ ...hostelData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostelPhone">Phone Number</Label>
                  <Input
                    id="hostelPhone"
                    value={hostelData.phone}
                    onChange={(e) => setHostelData({ ...hostelData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostelEmail">Email</Label>
                  <Input
                    id="hostelEmail"
                    type="email"
                    value={hostelData.email}
                    onChange={(e) => setHostelData({ ...hostelData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostelAddress">Address</Label>
                  <Input
                    id="hostelAddress"
                    value={hostelData.address}
                    onChange={(e) => setHostelData({ ...hostelData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHostel} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Hostel Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Configuration */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Backend connection settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API Base URL</Label>
                <Input
                  id="apiUrl"
                  defaultValue="http://localhost:5555"
                  placeholder="http://localhost:5555"
                />
                <p className="text-xs text-muted-foreground">
                  The base URL for the Flask backend API
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="text-sm font-medium">Environment Variable</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Set <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_API_URL</code> to
                  configure the API endpoint in production.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
