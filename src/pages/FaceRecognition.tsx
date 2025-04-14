
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const FaceRecognition = () => {
  const { students, processAttendance } = useData();
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const handleStartScan = () => {
    if (students.length === 0) {
      setError("No students found in the database. Please add students first.");
      return;
    }

    setError("");
    setCompleted(false);
    setScanning(true);

    // Simulate face recognition process
    setTimeout(() => {
      // For demo purposes, randomly mark some students as present
      const recognizedFaces = students
        .filter(() => Math.random() > 0.3) // 70% chance of being recognized
        .map(student => student.usn);
      
      processAttendance(recognizedFaces);
      setScanning(false);
      setCompleted(true);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Face Recognition</h1>
        <p className="text-muted-foreground">
          Take attendance using facial recognition
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-md max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span>Facial Recognition</span>
          </CardTitle>
          <CardDescription>
            Start the camera to recognize students and mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-900/20 p-3 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {completed && (
            <div className="flex items-center gap-2 rounded-md bg-green-900/20 p-3 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>Attendance marked successfully!</span>
            </div>
          )}
          
          <div className="relative aspect-video bg-slate-900 rounded-md overflow-hidden flex items-center justify-center border border-slate-700">
            {scanning ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-slate-400">Scanning faces...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-12 w-12 text-slate-600" />
                <p className="text-sm text-slate-400">
                  {completed ? "Scan completed" : "Camera preview will appear here"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStartScan} 
            disabled={scanning}
            className="w-full"
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              "Start Face Recognition"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FaceRecognition;
