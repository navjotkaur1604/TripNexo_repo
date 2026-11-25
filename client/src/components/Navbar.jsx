import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, MapPin, LogOut, User, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTripBuilder } from '../context/TripBuilderContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { state } = useTripBuilder();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5 stroke-[2.4]" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Trip<span className="text-amber-400">Nexo</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-400 -mt-1">
              Rajasthan Smart Planner
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          <NavLink to="/explore" className={navLinkClass}>
            Explore
          </NavLink>
          <NavLink to="/planner" className={navLinkClass}>
            Planner
            {state.selectedDestinations.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                {state.selectedDestinations.length}
              </span>
            )}
          </NavLink>
          <NavLink to="/budget" className={navLinkClass}>
            Budget
          </NavLink>
          <NavLink to="/map" className={navLinkClass}>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Map
            </span>
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/my-trips" className={navLinkClass}>
              My Trips
            </NavLink>
          )}
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </span>
            </NavLink>
          )}
        </div>

        {/* Desktop Auth Controls */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:border-amber-500/40 transition-colors"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-amber-400" />
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-rose-500/50 hover:text-rose-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden rounded-lg border border-slate-800 p-2 text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2">
          <div className="flex flex-col space-y-1">
            <NavLink to="/explore" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Explore Destinations
            </NavLink>
            <NavLink to="/planner" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Smart Planner ({state.selectedDestinations.length})
            </NavLink>
            <NavLink to="/budget" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Budget Calculator
            </NavLink>
            <NavLink to="/map" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              Interactive Map
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-trips" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  My Trips Dashboard
                </span>
              </NavLink>
            )}
            <NavLink to="/about" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              About TripNexo
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                Admin Console
              </NavLink>
            )}
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-xl border border-slate-700 py-2 text-sm text-slate-200"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-rose-500/15 border border-rose-500/30 py-2 text-sm text-rose-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-xl border border-slate-700 py-2 text-sm text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-xl bg-amber-500 py-2 text-sm font-semibold text-slate-950"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
