
import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, CalendarDays } from "lucide-react";
import { DashboardDatePicker } from "@/components/DashboardDatePicker";
import { format } from "date-fns";

const Dashboard = () => {
  const { students } = useData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [forceUpdate, setForceUpdate] = useState(0);
  
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
        <DashboardDatePicker 
          date={selectedDate} 
          onDateChange={setSelectedDate} 
        />
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
