import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TeacherRequests({ teacherId, myClasses }) {
  const [activeTab, setActiveTab] = useState('incoming'); 
  const [teachers, setTeachers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  
  // Form State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchIncomingRequests();

    const channel = supabase
      .channel('requests_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_requests' }, () => {
        fetchIncomingRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [teacherId]);

  async function fetchTeachers() {
    const { data } = await supabase.from('users').select('id, name').eq('role', 'teacher').neq('id', teacherId);
    setTeachers(data || []);
  }

  async function fetchIncomingRequests() {
    // --- THE FIX ---
    // 1. We fetch 'subject:subjects(name)' instead of just 'subject'
    //    because 'subject' column no longer exists (it's a relation now).
    const { data: requests, error } = await supabase
      .from('class_requests')
      .select(`
        *,
        timetable:timetable (
          day, 
          start_time, 
          class_name, 
          branch, 
          semester,
          subject:subjects(name)
        )
      `)
      .eq('to_teacher_id', teacherId)
      .eq('status', 'pending');

    if (error) {
      console.error("Error fetching requests:", error);
      return;
    }

    if (!requests || requests.length === 0) {
      setIncomingRequests([]);
      return;
    }

    // 2. Manually fetch sender names (Bulletproof method)
    const senderIds = [...new Set(requests.map(r => r.from_teacher_id))];
    const { data: senders } = await supabase.from('users').select('id, name').in('id', senderIds);
    const senderMap = {};
    senders?.forEach(user => senderMap[user.id] = user);

    const combinedData = requests.map(req => ({
      ...req,
      sender: senderMap[req.from_teacher_id] || { name: "Unknown Teacher" }
    }));

    setIncomingRequests(combinedData);
  }

  const handleSendRequest = async () => {
    if (!selectedClassId || !targetTeacherId) return;
    setLoading(true);
    
    const { error } = await supabase.from('class_requests').insert([{
      from_teacher_id: teacherId,
      to_teacher_id: targetTeacherId,
      timetable_id: selectedClassId,
      status: 'pending'
    }]);

    if (error) {
      alert("Failed: " + error.message);
    } else {
      // Notify Target Teacher
      await supabase.from('notifications').insert([{
        user_id: targetTeacherId,
        title: "New Class Request",
        message: "A teacher has asked you to cover their class.",
        is_read: false
      }]);
      alert("Request sent!");
      setActiveTab('incoming');
      setSelectedClassId('');
      setTargetTeacherId('');
    }
    setLoading(false);
  };

  const handleResponse = async (request, status) => {
    // 1. Update Request Status
    await supabase.from('class_requests').update({ status }).eq('id', request.id);
    
    const subjectName = request.timetable?.subject?.name || "Unknown Subject";

    // 2. IF APPROVED: Swap teacher AND Notify Students
    if (status === 'approved') {
      // Swap Teacher in Timetable
      await supabase
        .from('timetable')
        .update({ teacher_id: teacherId }) 
        .eq('id', request.timetable_id);
      
      // Notify Students
      if (request.timetable?.branch && request.timetable?.semester) {
         await supabase.from('student_notices').insert([{
           branch: request.timetable.branch,
           semester: request.timetable.semester,
           title: "Class Change Update",
           // FIX: Use subjectName variable
           message: `Your ${subjectName} class on ${request.timetable.day} at ${request.timetable.start_time} will now be taken by a substitute teacher.`
         }]);
      }
    }

    // 3. Notify Original Teacher
    const responseText = status === 'approved' ? "accepted" : "rejected";
    await supabase.from('notifications').insert([{
      user_id: request.from_teacher_id,
      title: `Request ${status}`,
      // FIX: Use subjectName variable
      message: `Your request for ${subjectName} was ${responseText}.`,
      is_read: false
    }]);

    alert(`Request ${status}!`);
    fetchIncomingRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button 
          variant={activeTab === 'incoming' ? 'default' : 'outline'}
          onClick={() => setActiveTab('incoming')}
          className={activeTab === 'incoming' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-transparent text-white border-slate-600 hover:bg-slate-800"}
        >
          Incoming Requests
          {incomingRequests.length > 0 && (
            <Badge className="ml-2 bg-red-500 text-white border-none">{incomingRequests.length}</Badge>
          )}
        </Button>
        <Button 
          variant={activeTab === 'new' ? 'default' : 'outline'}
          onClick={() => setActiveTab('new')}
          className={activeTab === 'new' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-transparent text-white border-slate-600 hover:bg-slate-800"}
        >
          Request a Sub
        </Button>
      </div>

      {activeTab === 'incoming' ? (
        <div className="grid gap-4">
          {incomingRequests.length === 0 && <p className="text-slate-500">No pending requests.</p>}
          {incomingRequests.map(req => (
            <Card key={req.id} className="bg-slate-800 border-slate-700 text-slate-200">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{req.sender?.name} needs help</p>
                  <p className="text-sm text-slate-400">
                    {/* FIX: Access nested name property */}
                    {req.timetable?.subject?.name || "Unknown Subject"} ({req.timetable?.class_name})
                  </p>
                  <p className="text-xs text-indigo-400 mt-1">
                    {req.timetable?.day} at {req.timetable?.start_time}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleResponse(req, 'approved')}>
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleResponse(req, 'rejected')}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-800 border-slate-700 p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Which class do you need covered?</label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {myClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id} className="focus:bg-slate-800 focus:text-white">
                    {/* FIX: Access nested name property */}
                    {cls.day} - {cls.slot}: {cls.subject?.name || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Ask which teacher?</label>
            <Select value={targetTeacherId} onValueChange={setTargetTeacherId}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id} className="focus:bg-slate-800 focus:text-white">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSendRequest} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading && <Loader2 className="animate-spin mr-2" />} Send Request
          </Button>
        </Card>
      )}
    </div>
  );
}