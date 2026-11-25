import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Heart, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = await authAPI.updateProfile({ name });
      setUser(data.user);
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      setUploading(true);
      const data = await authAPI.uploadProfileImage(formData);
      setUser((prev) => ({ ...prev, profileImage: data.profileImage }));
      showToast(`Profile image uploaded (${data.storageDriver} storage).`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Account</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">Traveller Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 flex flex-col items-center text-center">
          <div className="relative">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover border-2 border-amber-500/40"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 text-amber-400">
                <User className="h-10 w-10" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-lg hover:bg-amber-400">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">{user?.name}</h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <span className="mt-2 rounded-full bg-amber-500/15 px-3 py-0.5 text-[11px] font-semibold uppercase text-amber-300">
            {user?.role}
          </span>
          {uploading && <p className="mt-2 text-xs text-amber-300">Uploading photo...</p>}
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Edit Account Details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Favourite Destinations */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-400" />
          <h2 className="text-lg font-semibold text-white">
            Favourite Destinations ({user?.favorites?.length || 0})
          </h2>
        </div>
        {!user?.favorites?.length ? (
          <p className="text-sm text-slate-400">
            You haven’t starred any destinations yet.{' '}
            <Link to="/explore" className="text-amber-400 hover:underline">
              Explore Rajasthan
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {user.favorites.map((fav) => (
              <Link
                key={fav._id}
                to={`/destination/${fav.slug || fav._id}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-amber-500/40 transition-colors"
              >
                <p className="font-semibold text-white">{fav.name}</p>
                <p className="text-xs text-slate-400">
                  {fav.region} · {fav.recommendedDays} day(s)
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
