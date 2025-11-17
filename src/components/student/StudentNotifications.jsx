import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell } from 'lucide-react';

export default function StudentNotifications({ branch, semester }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!branch || !semester) return;

    async function fetchNotices() {
      // Fetch notices specifically for this class (or global notices)
      const { data } = await supabase
        .from('student_notices')
        .select('*')
        .match({ branch, semester }) // Simple filter
        .order('created_at', { ascending: false });
      
      setNotifications(data || []);
    }
    fetchNotices();

    // Realtime Subscription
    const channel = supabase
      .channel('student_notices')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'student_notices', filter: `branch=eq.${branch}` }, 
        (payload) => {
          // Double check semester in the client callback
          if (payload.new.semester == semester) {
             setNotifications(prev => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [branch, semester]);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 min-h-[200px]">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" /> Notice Board
      </h3>
      <div className="space-y-3">
        {notifications.length === 0 && <p className="text-slate-500 text-sm">No new notices.</p>}
        
        {notifications.map(note => (
          <div key={note.id} className="p-3 rounded-lg border-l-4 border-emerald-500 bg-slate-900">
            <h4 className="text-sm font-medium text-emerald-400">{note.title}</h4>
            <p className="text-xs text-slate-300 mt-1">{note.message}</p>
            <span className="text-[10px] text-slate-500 mt-2 block">
              {new Date(note.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}