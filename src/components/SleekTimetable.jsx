import React from "react";
import { Clock, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-purple-600 border-purple-500",
  "bg-pink-600 border-pink-500",
  "bg-blue-600 border-blue-500",
  "bg-emerald-600 border-emerald-500",
  "bg-orange-600 border-orange-500",
];

export default function SleekTimetable({ timetable, days, slots }) {
  if (!timetable) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
      {days.map((day, dayIdx) => {
        // Get entries for this day, sorted by time
        const dayEntries = slots.map((slot) => {
          const entry = timetable[day]?.find((e) => e.slot === slot);
          return { slot, ...entry };
        });

        // Assign a color based on the day index (just for style)
        const headerColor = [
          "bg-emerald-500",
          "bg-pink-500",
          "bg-violet-500",
          "bg-blue-500",
          "bg-orange-500",
        ][dayIdx % 5];

        return (
          <div key={day} className="flex flex-col gap-3">
            {/* --- Day Header --- */}
            <div className={cn("p-3 rounded-xl text-center font-bold text-white shadow-lg", headerColor)}>
              {day}
            </div>

            {/* --- Time Slots --- */}
            {dayEntries.map((entry, idx) => {
              // 1. LUNCH BREAK
              if (entry.slot === "13:00") {
                 // Only show lunch break text once or simply as a small divider
                 return (
                   <div key={idx} className="flex items-center justify-center p-2 rounded-lg bg-slate-800/50 text-slate-400 text-xs border border-slate-700/50 border-dashed">
                     <Coffee className="w-3 h-3 mr-2" /> Lunch Break
                   </div>
                 );
              }

              // 2. EMPTY SLOT
              if (!entry.subject_id) {
                return (
                   <div key={idx} className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 min-h-[100px] flex items-center justify-center opacity-50">
                     <span className="text-slate-600 text-sm font-medium">{entry.slot}</span>
                   </div>
                );
              }

              // 3. CLASS CARD
              // Pick a random-ish color based on subject name length
              const cardColor = COLORS[entry.subject.length % COLORS.length];

              return (
                <div key={idx} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  
                  <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    {/* Time Pill */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700">
                         <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
                           <Clock className="w-3 h-3" /> {entry.slot}
                         </span>
                      </div>
                    </div>

                    {/* Subject Name */}
                    <h3 className="text-white font-semibold text-lg leading-tight mb-1">
                      {entry.subject}
                    </h3>

                    {/* Class Name (e.g., "CSE 3rd Sem") */}
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">
                      {entry.class_name}
                    </p>
                    
                    {/* Room Badge */}
                    <div className={cn("inline-block px-2 py-1 rounded text-xs font-medium text-white border-l-4", cardColor)}>
                       {entry.room_name || "No Room"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}