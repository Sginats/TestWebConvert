'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export function SettingsClient({ user }: { user: User }) {
  const [name, setName] = useState(user.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, string> = {};
    if (name !== user.name) payload.name = name;
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      toast({ title: 'Nothing to save', description: 'No changes were made.' });
      return;
    }

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      toast({ title: 'Settings saved!', description: 'Your profile has been updated.' });
      setCurrentPassword('');
      setNewPassword('');
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">{user.email} · {user.role}</p>
      </div>

      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSave} className="space-y-5">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <hr className="border-border/50 my-4" />
          <h2 className="text-lg font-semibold">Change Password</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Leave blank to keep current"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
