import { useState, useEffect, useCallback } from 'react';
import { Database, MapPin, MessageSquare, Shield, Users } from 'lucide-react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatDate, formatINRRange } from '../utils/formatters';

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdmin = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [dash, usersRes, tripsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        adminAPI.getTrips(),
      ]);
      setMetrics(dash.metrics);
      setUsers(usersRes.users || []);
      setTrips(tripsRes.trips || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  if (loading) return <LoadingSpinner label="Loading admin console..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadAdmin} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-amber-400" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Role-Protected Console
          </p>
          <h1 className="font-display text-3xl font-bold text-white">TripNexo Admin Dashboard</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <Users className="h-5 w-5 text-amber-400 mb-2" />
          <p className="text-xs text-slate-400">Registered Users</p>
          <p className="text-2xl font-bold text-white">{metrics?.totalUsers ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <MapPin className="h-5 w-5 text-sky-400 mb-2" />
          <p className="text-xs text-slate-400">Rajasthan Destinations</p>
          <p className="text-2xl font-bold text-white">{metrics?.totalDestinations ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <Database className="h-5 w-5 text-emerald-400 mb-2" />
          <p className="text-xs text-slate-400">Saved Trips</p>
          <p className="text-2xl font-bold text-white">{metrics?.totalTrips ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
          <MessageSquare className="h-5 w-5 text-purple-400 mb-2" />
          <p className="text-xs text-slate-400">Traveller Reviews</p>
          <p className="text-2xl font-bold text-white">{metrics?.totalReviews ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-2.5 text-white font-medium">{u.name}</td>
                    <td className="py-2.5 text-slate-300">{u.email}</td>
                    <td className="py-2.5 uppercase text-amber-300">{u.role}</td>
                    <td className="py-2.5 text-slate-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">Recent Planned Trips ({trips.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2">Trip</th>
                  <th className="py-2">Traveller</th>
                  <th className="py-2">Days</th>
                  <th className="py-2">Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td className="py-2.5 text-white font-medium">{t.tripName}</td>
                    <td className="py-2.5 text-slate-300">{t.userId?.name || 'User'}</td>
                    <td className="py-2.5 text-slate-300">{t.duration}</td>
                    <td className="py-2.5 text-emerald-400">
                      {formatINRRange(t.estimatedCost?.min, t.estimatedCost?.max)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
