import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, LogOut, Plus, User as UserIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "Plan" },
    { to: "/trips", label: "My Trips" },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-sand-line bg-[#FAF7F2]/85 backdrop-blur-xl"
      data-testid="app-navbar"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="navbar-brand-link">
          <span className="flex size-9 items-center justify-center rounded-xl bg-terracotta text-white transition-transform duration-200 group-hover:rotate-12">
            <Compass className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">VoyageAI</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-testid={`navbar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors duration-150 hover:bg-sand hover:text-stone-900",
                location.pathname === item.to && "bg-sand text-stone-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => navigate("/create-trip")}
                data-testid="navbar-new-trip-button"
              >
                <Plus className="size-4" /> New trip
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" data-testid="navbar-user-menu-trigger">
                      <UserIcon className="size-5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <span className="block truncate text-sm font-medium">{user?.name}</span>
                      <span className="block truncate text-xs text-stone-500">{user?.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/trips")}
                      data-testid="navbar-menu-trips"
                    >
                      My trips
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => void endSession("/login")}
                      data-testid="navbar-logout-button"
                    >
                      <LogOut className="size-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                data-testid="navbar-login-link"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className={buttonVariants({ variant: "default", size: "sm" })}
                data-testid="navbar-register-link"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
