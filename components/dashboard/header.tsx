"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/rooms": "Rooms",
  "/dashboard/tenants": "Tenants",
  "/dashboard/billings": "Billings",
  "/dashboard/payments": "Payments",
  "/dashboard/reports": "Reports",
  "/dashboard/users": "User Management",
  "/dashboard/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold lg:text-2xl ml-12 lg:ml-0">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9 bg-muted/50"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
