import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function UserDashboard() {
  // Data for dropdowns
  const [teachers, setTeachers] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  
  // Selected values
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(''); // Will be "CSE-3"
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch all teachers
      const { data: teacherData, error: teacherError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'teacher');
      
      // Fetch all generated student groups (using the RPC we already made!)
      const { data: groupData, error: groupError } = await supabase
        .rpc('get_generated_timetables');
      
      if (!teacherError) setTeachers(teacherData || []);
      if (!groupError) setStudentGroups(groupData || []);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleViewTeacher = () => {
    if (selectedTeacher) {
      navigate(`/teacher/${selectedTeacher}`);
    }
  };

  const handleViewStudent = () => {
    if (selectedGroup) {
      const [branch, semester] = selectedGroup.split('-');
      navigate(`/student/${branch}/${semester}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- Teacher View --- */}
        <Card>
          <CardHeader>
            <CardTitle>View as Teacher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher..." />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleViewTeacher} disabled={!selectedTeacher} className="w-full">
              View Teacher Timetable
            </Button>
          </CardContent>
        </Card>

        {/* --- Student View --- */}
        <Card>
          <CardHeader>
            <CardTitle>View as Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Class</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {studentGroups.map(group => (
                  <SelectItem key={`${group.branch}-${group.semester}`} value={`${group.branch}-${group.semester}`}>
                    {group.branch} - Semester {group.semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleViewStudent} disabled={!selectedGroup} className="w-full">
              View Student Timetable
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}