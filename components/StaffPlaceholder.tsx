'use client';

import { useEffect, useState } from 'react';
import EventName from '@/components/EventName';

// Temporary home for a staff group whose dashboard isn't designed yet.
// Anyone without that group's session is sent back to the /admin login.
export default function StaffPlaceholder({ role, title }: { role: string; title: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/admin/login', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data.role === role) setReady(true);
        else window.location.replace('/admin');
      })
      .catch(() => window.location.replace('/admin'));
  }, [role]);

  if (!ready) return <div className="min-h-screen bg-halloween-dark" />;

  return (
    <div className="min-h-screen bg-halloween-dark px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-halloween-orange mb-2">{title}</h1>
        <p className="display-font mb-8"><EventName /></p>
        <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-8 space-y-6">
          <p className="text-halloween-cream font-iannnnn-owl">หน้าหลังบ้านส่วนนี้กำลังทำอยู่</p>
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {});
              window.location.replace('/admin');
            }}
            className="w-full bg-halloween-red hover:bg-halloween-orange text-halloween-dark font-bold py-3 rounded-lg transition-colors font-iannnnn-owl"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
