
import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, CalendarDays, UserX2 } from "lucide-react";
import { DashboardDatePicker } from "@/components/DashboardDatePicker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSemesterFromClass } from "@/utils/timetableUtils";

const Dashboard = () => {
  const { students } = useData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showAbsentees, setShowAbsentees] = useState(false);
  
  // Force a re-render when navigating to the dashboard
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, []);
  
  // Format the selected date to match the attendance records format
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // Calculate attendance statistics
  const totalStudents = students.length;
  const presentToday = students.filter(s => s.attendance[formattedDate] === 'present').length;
  const absentToday = students.filter(s => s.attendance[formattedDate] === 'absent').length;
  const attendanceRate = totalStudents > 0 
    ? Math.round((presentToday / totalStudents) * 100) 
    : 0;

  // Group absent students by semester
  const absenteesBySemester = () => {
    // Create array with 8 semester groups
    const semesterGroups = Array.from({ length: 8 }, (_, i) => ({
      semester: i + 1,
      students: []
    }));

    // Filter students who are absent on the selected date
    const absentStudents = students.filter(s => s.attendance[formattedDate] === 'absent');
    
    // Sort them into semester groups
    absentStudents.forEach(student => {
      const semNumber = getSemesterFromClass(student.class);
      // Ensure semester number is within bounds (1-8)
      const index = Math.min(Math.max(semNumber - 1, 0), 7);
      semesterGroups[index].students.push(student);
    });

    return semesterGroups;
  };

  // Toggle absentees list view
  const toggleAbsentees = () => {
    setShowAbsentees(!showAbsentees);
  };

  // Helper function to get ordinal suffix for numbers
  const getSuffixForNumber = (num: number): string => {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  // Log the current date and attendance status to help with debugging
  console.log(`Dashboard date: ${formattedDate}`);
  console.log(`Students with attendance records:`, students.map(s => ({
    name: s.name,
    date: formattedDate,
    status: s.attendance[formattedDate] || 'not marked'
  })));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your attendance tracking dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={toggleAbsentees}
          >
            <UserX2 className="h-4 w-4 text-red-500" />
            Absentees List
            {absentToday > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
                {absentToday}
              </span>
            )}
          </Button>
          <DashboardDatePicker 
            date={selectedDate} 
            onDateChange={setSelectedDate} 
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Present on {format(selectedDate, "MMM d")}</CardTitle>
            <UserCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {presentToday > 0 
                ? `${Math.round((presentToday / totalStudents) * 100)}% of total` 
                : 'No students present'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Absent on {format(selectedDate, "MMM d")}</CardTitle>
            <UserX className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {absentToday > 0 
                ? `${Math.round((absentToday / totalStudents) * 100)}% of total` 
                : 'No students absent'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CalendarDays className="h-5 w-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Attendance rate for {format(selectedDate, "MMM d")}
            </p>
          </CardContent>
        </Card>
      </div>

      {showAbsentees && (
        <Card className="bg-slate-800 border-slate-700 shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserX2 className="h-5 w-5 text-red-500" />
              <span>Absentees for {format(selectedDate, "MMMM d, yyyy")}</span>
            </CardTitle>
            <div className="text-sm text-slate-400">
              {absentToday} {absentToday === 1 ? "student" : "students"} absent
            </div>
          </CardHeader>
          <CardContent>
            {absentToday > 0 ? (
              <Tabs defaultValue="1">
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-4">
                  {absenteesBySemester().map((group, index) => (
                    <TabsTrigger 
                      key={index} 
                      value={String(index + 1)}
                      className="relative"
                    >
                      {index + 1}{getSuffixForNumber(index + 1)} Sem
                      {group.students.length > 0 && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                          {group.students.length}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {absenteesBySemester().map((group, index) => (
                  <TabsContent key={index} value={String(index + 1)}>
                    {group.students.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {group.students.map(student => (
                          <Card key={student.id} className="bg-slate-700 border-slate-600">
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-slate-600">
                                  <AvatarImage src={student.photo} alt={student.name} />
                                  <AvatarFallback className="bg-slate-600 text-slate-300">
                                    {student.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-sm text-slate-400">{student.usn}</div>
                                </div>
                              </div>
                              <div className="mt-3 text-sm grid grid-cols-2 gap-2">
                                <div className="text-slate-400">Class:</div>
                                <div>{student.class}</div>
                                <div className="text-slate-400">Mobile:</div>
                                <div>{student.mobile}</div>
                                {student.parentMobile && (
                                  <>
                                    <div className="text-slate-400">Parent Mobile:</div>
                                    <div>{student.parentMobile}</div>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed border-slate-700">
                        No absent students in {index + 1}{getSuffixForNumber(index + 1)} semester
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No absent students found for this date.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle>Attendance for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="rounded-md border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">USN</th>
                      <th className="px-4 py-3 text-left font-medium">Class</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-t border-slate-700">
                        <td className="px-4 py-3">{student.name}</td>
                        <td className="px-4 py-3">{student.usn}</td>
                        <td className="px-4 py-3">{student.class}</td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            student.attendance[formattedDate] === 'present'
                              ? 'bg-green-900/20 text-green-400'
                              : student.attendance[formattedDate] === 'absent'
                              ? 'bg-red-900/20 text-red-400'
                              : 'bg-yellow-900/20 text-yellow-400'
                          }`}>
                            {student.attendance[formattedDate] === 'present'
                              ? 'Present'
                              : student.attendance[formattedDate] === 'absent'
                              ? 'Absent'
                              : 'Not Marked'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No students data available. Add some students to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
