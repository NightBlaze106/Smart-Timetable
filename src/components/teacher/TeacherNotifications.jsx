import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell } from 'lucide-react';

export default function TeacherNotifications({ teacherId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotes();

    // Enable Realtime Notifications
    const channel = supabase
      .channel('notifications_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${teacherId}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [teacherId]);

  async function fetchNotes() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', teacherId)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 min-h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" /> Notifications
      </h3>
      <div className="space-y-3">
        {notifications.length === 0 && <p className="text-slate-500">No notifications yet.</p>}
        {notifications.map(note => (
          <div key={note.id} className={`p-3 rounded-lg border-l-4 ${note.is_read ? 'border-slate-600 bg-slate-900/50' : 'border-indigo-500 bg-slate-900'}`}>
            <h4 className="text-sm font-medium text-slate-200">{note.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{note.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}