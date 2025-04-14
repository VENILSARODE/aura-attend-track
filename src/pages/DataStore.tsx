
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Database, Search, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

const DataStore = () => {
  const { students, updateAttendance } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.usn.toLowerCase().includes(searchLower) ||
      student.class.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Store</h1>
        <p className="text-muted-foreground">
          View and manage student attendance records
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
            <span>Student Records</span>
          </CardTitle>
          <div className="text-sm text-slate-400">
            {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="rounded-md border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">USN</th>
                      <th className="px-4 py-3 text-left font-medium">Class</th>
                      <th className="px-4 py-3 text-left font-medium">Mobile</th>
                      <th className="px-4 py-3 text-left font-medium">Today's Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-t border-slate-700">
                        <td className="px-4 py-3">{student.name}</td>
                        <td className="px-4 py-3">{student.usn}</td>
                        <td className="px-4 py-3">{student.class}</td>
                        <td className="px-4 py-3">{student.mobile}</td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-900/20"
                              onClick={() => updateAttendance(student.id, today, 'present')}
                              title="Mark as present"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                              onClick={() => updateAttendance(student.id, today, 'absent')}
                              title="Mark as absent"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
