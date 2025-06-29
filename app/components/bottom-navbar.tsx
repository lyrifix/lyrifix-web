import { CircleGaugeIcon, HomeIcon, PaletteIcon, UserIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import type { User } from "~/schemas/user";

interface BottomNavbarProps {
  isAuthenticated?: boolean;
  user?: User;
}

export const BottomNavbar = ({ isAuthenticated, user }: BottomNavbarProps) => {
  const location = useLocation();
  const isLibraryPath = location.pathname.startsWith("/library");
  const navLinks = [
    { to: "/", icon: <HomeIcon />, text: "Home" },
    { to: "/artists", icon: <PaletteIcon />, text: "Artists" },
  ];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-700 bg-black text-white">
      <div
        className={cn(
          "grid gap-4",
          isAuthenticated && "grid-cols-4",
          !isAuthenticated && "grid-cols-3",
        )}
      >
        {navLinks.map((navLink) => {
          return (
            <NavLink
              key={navLink.to}
              to={navLink.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center p-2",
                  isActive && "text-fuchsia-400",
                )
              }
            >
              {navLink.icon}
              <span className="text-sm">{navLink.text}</span>
            </NavLink>
          );
        })}

        {isAuthenticated && user && (
          <NavLink
            to="/library"
            className={cn(
              "flex flex-col items-center justify-center p-2",
              isLibraryPath && "text-fuchsia-400",
            )}
          >
            <CircleGaugeIcon className="mb-1 h-6 w-6" />
            <span className="text-sm">Your Library</span>
          </NavLink>
        )}

        {isAuthenticated && user && (
          <NavLink
            to="/logout"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2",
                isActive && "text-fuchsia-400",
              )
            }
          >
            <UserIcon className="mb-1 h-6 w-6" />
            <span className="text-sm">{user.username}</span>
          </NavLink>
        )}

        {!isAuthenticated && !user && (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2",
                isActive && "text-fuchsia-400",
              )
            }
          >
            <UserIcon className="mb-1 h-6 w-6" />
            <span className="text-sm">Login</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};
