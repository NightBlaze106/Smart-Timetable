import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import SleekTimetable from '@/components/SleekTimetable';
import StudentNotifications from '@/components/student/StudentNotifications';
import { Loader2, BookOpen } from 'lucide-react';

export default function StudentDashboard() {
  const { branch, semester } = useParams();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState(null);

  // Constants
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch the timetable for this Branch & Semester
      // We use 'timetable_teacher_id_fkey' to get the teacher's name
      const { data: rawData, error } = await supabase
        .from('timetable')
        .select(`
          slot: start_time,
          day,
          class_name,
          subject: subjects(name),
          room: rooms(name),
          teacher: users!timetable_teacher_id_fkey(name)
        `)
        .eq('branch', branch)
        .eq('semester', semester);

      if (error) {
        console.error("Error fetching student timetable:", error);
        setLoading(false);
        return;
      }

      // Process Data for SleekTimetable component
      const timetableObj = {};
      days.forEach(day => {
        timetableObj[day] = [];
        rawData.filter(r => r.day === day).forEach(r => {
          timetableObj[day].push({
            slot: r.slot.slice(0, 5),
            subject: r.subject?.name,
            class_name: r.teacher?.name || "No Teacher", 
            room_name: r.room?.name,
            subject_id: "true"
          });
        });
      });

      setTimetable(timetableObj);
      setLoading(false);
    }

    fetchData();
  }, [branch, semester]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* --- Top Navbar --- */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Student Portal</span>
          </div>

          {/* Right: Status & Profile */}
          <div className="flex items-center gap-6">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Live</span>
            </div>

            {/* Student Info Chip */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-none mb-1">{branch}</p>
                <p className="text-xs text-slate-500">Semester {semester}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {branch?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left: Timetable (Takes up 3 columns) */}
          <div className="lg:col-span-3">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Weekly Schedule</h1>
                <p className="text-slate-400 text-sm">View your classes and upcoming events.</p>
              </div>
            </div>

            <SleekTimetable timetable={timetable} days={days} slots={slots} />
          </div>

          {/* Right: Sidebar Widgets (Takes up 1 column) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notifications Widget */}
            <StudentNotifications branch={branch} semester={semester} />
            
            {/* Attendance / Stats Widget */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg text-center border border-slate-800">
                   <span className="block text-2xl font-bold text-emerald-400">85%</span>
                   <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Attendance</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg text-center border border-slate-800">
                   <span className="block text-2xl font-bold text-blue-400">3</span>
                   <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Assignments</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}