import { Link } from 'react-router-dom';
import { Compass, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
                <Compass className="h-4 w-4 stroke-[2.4]" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Trip<span className="text-amber-400">Nexo</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md text-slate-400">
              A smart Rajasthan travel-planning and budget-estimation platform. Build structured day-wise
              itineraries, estimate costs transparently, inspect coordinates on OpenStreetMap, and export
              clean PDF plans.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Planning & estimation platform only — estimates are indicative, not live quotations.</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="hover:text-amber-400 transition-colors">
                  Explore Rajasthan
                </Link>
              </li>
              <li>
                <Link to="/planner" className="hover:text-amber-400 transition-colors">
                  Smart Trip Planner
                </Link>
              </li>
              <li>
                <Link to="/budget" className="hover:text-amber-400 transition-colors">
                  Budget Calculator
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-amber-400 transition-colors">
                  Interactive Map
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Account & Project
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/my-trips" className="hover:text-amber-400 transition-colors">
                  My Trips Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-amber-400 transition-colors">
                  Traveller Profile
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors">
                  About & Methodology
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-400 transition-colors">
                  Create Free Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TripNexo — Smart Rajasthan Travel Planning Platform.</p>
          <p>Built on the MERN Stack with Redis Caching, Microservices & OpenStreetMap.</p>
        </div>
      </div>
    </footer>
  );
}
