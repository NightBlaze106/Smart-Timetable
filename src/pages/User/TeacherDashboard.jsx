import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import SleekTimetable from '@/components/SleekTimetable';
import TeacherChat from '@/components/teacher/TeacherChat';
import TeacherRequests from '@/components/teacher/TeacherRequests';
import TeacherNotifications from '@/components/teacher/TeacherNotifications';
import { Loader2, Calendar, MessageSquare, Bell, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NavItem = ({ icon: Icon, label, id, activeId, onClick }) => (
  <div 
    onClick={() => onClick(id)}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
      activeId === id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}>
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </div>
);

export default function TeacherDashboard() {
  const { teacherId } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('timetable'); // 'timetable' | 'requests' | 'chat' | 'notifications'
  
  // Data
  const [fullTimetable, setFullTimetable] = useState(null);
  const [filteredTimetable, setFilteredTimetable] = useState(null);
  const [rawClasses, setRawClasses] = useState([]); // Used for dropdowns in RequestManager
  const [teacherName, setTeacherName] = useState("");
  
  // Filters
  const [classList, setClassList] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All Classes");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: userData } = await supabase.from('users').select('name').eq('id', teacherId).single();
      setTeacherName(userData?.name || "Teacher");

      const { data: rawData, error } = await supabase
        .from('timetable')
        .select(`
          id,
          slot: start_time,
          day,
          class_name,
          subject: subjects(name),
          room: rooms(name)
        `)
        .eq('teacher_id', teacherId);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setRawClasses(rawData); // Store raw data for the request form

      // Process for Timetable View
      const uniqueClasses = ["All Classes", ...new Set(rawData.map(r => r.class_name))];
      setClassList(uniqueClasses);

      const processRows = (rows) => {
        const timetableObj = {};
        days.forEach(day => {
          timetableObj[day] = [];
          rows.filter(r => r.day === day).forEach(r => {
            timetableObj[day].push({
              slot: r.slot.slice(0, 5),
              subject: r.subject?.name,
              room_name: r.room?.name,
              class_name: r.class_name,
              subject_id: "true"
            });
          });
        });
        return timetableObj;
      };

      const processed = processRows(rawData);
      setFullTimetable(processed);
      setFilteredTimetable(processed);
      setLoading(false);
    }
    fetchData();
  }, [teacherId]);

  const handleFilter = (filterName) => {
    setActiveFilter(filterName);
    if (filterName === "All Classes") {
      setFilteredTimetable(fullTimetable);
    } else {
      const newTimetable = {};
      days.forEach(day => {
        newTimetable[day] = fullTimetable[day].filter(entry => entry.class_name === filterName);
      });
      setFilteredTimetable(newTimetable);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Scheduler</span>
        </div>

        <nav className="space-y-2">
          <NavItem icon={Calendar} label="Timetable" id="timetable" activeId={activeView} onClick={setActiveView} />
          <NavItem icon={ArrowRightLeft} label="Requests" id="requests" activeId={activeView} onClick={setActiveView} />
          <NavItem icon={Bell} label="Notifications" id="notifications" activeId={activeView} onClick={setActiveView} />
          <NavItem icon={MessageSquare} label="Staff Chat" id="chat" activeId={activeView} onClick={setActiveView} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
              {teacherName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{teacherName}</p>
              <p className="text-xs text-slate-500">Teacher</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeView === 'timetable' && (
          <>
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Your Week Ahead</h1>
                <p className="text-slate-400">Manage your classes and schedule efficiently.</p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Print Schedule</Button>
            </header>

            <div className="flex flex-wrap gap-2 mb-8">
              {classList.map(cls => (
                <button
                  key={cls}
                  onClick={() => handleFilter(cls)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    activeFilter === cls ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                  )}
                >
                  {cls}
                </button>
              ))}
            </div>
            <SleekTimetable timetable={filteredTimetable} days={days} slots={slots} />
          </>
        )}

        {activeView === 'chat' && <TeacherChat teacherId={teacherId} />}
        {activeView === 'requests' && <TeacherRequests teacherId={teacherId} myClasses={rawClasses} />}
        {activeView === 'notifications' && <TeacherNotifications teacherId={teacherId} />}
      </main>
    </div>
  );
}