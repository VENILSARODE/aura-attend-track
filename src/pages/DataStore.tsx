import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Database, Search, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SemesterGroup } from "@/types";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPeriod, getSubjectForPeriod } from "@/utils/timetableUtils";

const DataStore = () => {
  const { students, updateAttendance } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const { toast } = useToast();

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.usn.toLowerCase().includes(searchLower) ||
      student.class.toLowerCase().includes(searchLower)
    );
  });

  // Function to handle attendance update and send message to parents if absent
  const handleAttendanceUpdate = (studentId: string, status: 'present' | 'absent') => {
    updateAttendance(studentId, today, status);
    
    // If student is marked absent, send message to parent
    if (status === 'absent') {
      const student = students.find(s => s.id === studentId);
      if (student) {
        sendAbsentNotification(student);
      }
    }
  };

  // Function to send absent notification to parent
  const sendAbsentNotification = (student: any) => {
    // Get current period
    const currentPeriod = getCurrentPeriod();
    
    // For real implementation, we would lookup the actual timetable image
    // but for now we'll use a generic subject based on period
    const currentSubject = getSubjectForPeriod(null, currentPeriod);
    
    // Format current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Construct the message
    const message = `Dear sir/ma'am,
    
Your child ${student.name} is absent for the class subject ${currentSubject} at ${timeString}.

Thank you
BITM Regards`;

    // Send message to parent's mobile
    const parentMobile = student.parentMobile || student.mobile;
    
    if (parentMobile) {
      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${parentMobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Open SMS
      const smsUrl = `sms:${parentMobile}?body=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.location.href = smsUrl;
      }, 1000); // Delay SMS slightly to ensure both windows can open
      
      toast({
        title: "Notification Sent",
        description: `Attendance notification sent to parent of ${student.name}`,
      });
    } else {
      toast({
        title: "Missing Contact",
        description: "Parent mobile number not available for this student",
        variant: "destructive",
      });
    }
  };

  // Function to extract semester number from class string
  const getSemesterFromClass = (classStr: string): number => {
    // Try to extract numbers from the class string
    const semMatch = classStr.match(/(\d+)(st|nd|rd|th)?(\s+)?(sem|semester)?/i);
    if (semMatch) {
      return parseInt(semMatch[1], 10);
    }
    
    // Check for year-based format
    const yearMatch = classStr.match(/(1st|2nd|3rd|4th)(\s+)?year/i);
    if (yearMatch) {
      // Convert year to semester (approximately)
      switch(yearMatch[1].toLowerCase()) {
        case '1st': return 2; // 1st year ~ 2nd semester
        case '2nd': return 4; // 2nd year ~ 4th semester
        case '3rd': return 6; // 3rd year ~ 6th semester
        case '4th': return 8; // 4th year ~ 8th semester
        default: return 1;
      }
    }
    
    return 1; // Default to 1st semester if no match
  };

  // Helper function to get ordinal suffix for numbers
  const getSuffixForNumber = (num: number): string => {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  // Group students by semester
  const groupStudentsBySemester = (): SemesterGroup[] => {
    const semesterGroups: SemesterGroup[] = Array.from({ length: 8 }, (_, i) => ({
      title: `${i + 1}${getSuffixForNumber(i + 1)} Semester`,
      students: []
    }));

    filteredStudents.forEach(student => {
      const semNumber = getSemesterFromClass(student.class);
      // Ensure semester number is within bounds (1-8)
      const index = Math.min(Math.max(semNumber - 1, 0), 7);
      semesterGroups[index].students.push(student);
    });

    return semesterGroups;
  };

  const semesterGroups = groupStudentsBySemester();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Store</h1>
        <p className="text-muted-foreground">
          View and manage student attendance records by semester
        </p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name, USN or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-400">Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-400">Absent</span>
          </div>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>Student Records by Semester</span>
          </CardTitle>
          <div className="text-sm text-slate-400">
            {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <Tabs defaultValue="1">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-4">
                {semesterGroups.map((group, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={String(index + 1)}
                    className="relative"
                  >
                    {group.title}
                    {group.students.length > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        {group.students.length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {semesterGroups.map((group, index) => (
                <TabsContent key={index} value={String(index + 1)}>
                  {group.students.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700">
                          <TableHead className="w-[60px]">Photo</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>USN</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Today's Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.students.map((student) => (
                          <TableRow key={student.id} className="border-t border-slate-700">
                            <TableCell>
                              <Avatar className="h-9 w-9 border border-slate-600">
                                <AvatarImage src={student.photo} alt={student.name} />
                                <AvatarFallback className="bg-slate-700 text-slate-300">
                                  {student.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.usn}</TableCell>
                            <TableCell>{student.class}</TableCell>
                            <TableCell>
                              {student.mobile}
                              {student.parentMobile && (
                                <div className="text-xs text-slate-400">
                                  Parent: {student.parentMobile}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  student.attendance[today] === "present"
                                    ? "bg-green-900/20 text-green-400"
                                    : student.attendance[today] === "absent"
                                    ? "bg-red-900/20 text-red-400"
                                    : "bg-yellow-900/20 text-yellow-400"
                                }`}
                              >
                                {student.attendance[today] === "present"
                                  ? "Present"
                                  : student.attendance[today] === "absent"
                                  ? "Absent"
                                  : "Not Marked"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-900/20"
                                  onClick={() => handleAttendanceUpdate(student.id, 'present')}
                                  title="Mark as present"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                  onClick={() => handleAttendanceUpdate(student.id, 'absent')}
                                  title="Mark as absent"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed border-slate-700">
                      No students found in {group.title}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {students.length === 0
                ? "No students found in the database. Add students first."
                : "No students match your search."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataStore;
