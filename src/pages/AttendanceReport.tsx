import { useState } from "react";
import { Calendar, Clock, Users, Camera, CheckCircle, XCircle, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttendance } from "@/context/AttendanceContext";
import { useData } from "@/context/DataContext";

const AttendanceReport = () => {
  const { attendanceRecords, getTodayAttendance } = useAttendance();
  const { students } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());

  const todayAttendance = getTodayAttendance();
  const totalStudents = students.length;
  const presentToday = todayAttendance.filter(record => record.verified).length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

  // Get attendance by date
  const getAttendanceByDate = (date: string) => {
    return attendanceRecords.filter(
      record => new Date(record.timestamp).toDateString() === date
    );
  };

  const selectedDateAttendance = getAttendanceByDate(selectedDate);

  // Get recent attendance (last 10 records)
  const recentAttendance = attendanceRecords.slice(0, 10);

  // Camera-wise attendance stats
  const cameraStats = attendanceRecords.reduce((stats, record) => {
    if (!stats[record.cameraName]) {
      stats[record.cameraName] = { total: 0, verified: 0 };
    }
    stats[record.cameraName].total++;
    if (record.verified) {
      stats[record.cameraName].verified++;
    }
    return stats;
  }, {} as Record<string, { total: number; verified: number }>);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Report</h1>
          <p className="text-muted-foreground">CCTV-based automated attendance tracking</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
            <p className="text-xs text-muted-foreground">Verified by CCTV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">For today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRecords.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="cameras">Camera Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Verified Attendance</CardTitle>
              <CardDescription>
                Students verified through CCTV face recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Attendance Records</h3>
                  <p className="text-muted-foreground">No students have been verified today yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Camera</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.personName}</TableCell>
                        <TableCell>{formatTime(record.timestamp)}</TableCell>
                        <TableCell>{record.cameraName}</TableCell>
                        <TableCell>
                          <Badge variant={record.confidence > 0.8 ? "default" : "secondary"}>
                            {Math.round(record.confidence * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.verified ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest 10 attendance records from all cameras</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">No attendance records available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Camera</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.personName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(record.timestamp)}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(record.timestamp)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{record.cameraName}</TableCell>
                        <TableCell>
                          <Badge variant={record.confidence > 0.8 ? "default" : "secondary"}>
                            {Math.round(record.confidence * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.verified ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cameras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Camera Performance</CardTitle>
              <CardDescription>Attendance verification statistics by camera</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(cameraStats).length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Camera Data</h3>
                  <p className="text-muted-foreground">No attendance records from cameras yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(cameraStats).map(([cameraName, stats]) => (
                    <Card key={cameraName}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{cameraName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Detections:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Verified:</span>
                          <span className="font-medium text-green-600">{stats.verified}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate:</span>
                          <Badge variant={stats.total > 0 && (stats.verified / stats.total) > 0.8 ? "default" : "secondary"}>
                            {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceReport;