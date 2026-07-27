import { Link } from "@tanstack/react-router";
import { MoreVertical, User, ShieldCheck, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

/**
 * Menu for screens that don't belong in the bottom nav. The bottom nav items
 * are untouched — this only surfaces Account and sign-out.
 */
export function HeaderMenu() {
  const { user, signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open menu"
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-reserve-navy/10 bg-reserve-navy/5 text-reserve-navy transition active:scale-95"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel className="truncate text-[11px] font-normal text-reserve-slate">
          {user?.email ?? "Signed in"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer">
            <User className="mr-2 size-4" /> Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/approvals" className="cursor-pointer">
            <ShieldCheck className="mr-2 size-4" /> Withdrawal approvals
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}