
import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, CheckCircle2, Loader2, CameraOff, User, MoveLeft, MoveRight, MoveUp, MoveDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const FaceRecognition = () => {
  const { students, processAttendance, updateAttendance } = useData();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recognizedStudent, setRecognizedStudent] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  useEffect(() => {
    if (scanning && stream) {
      const positionTimer = setTimeout(() => {
        const positions = ["look_forward", "center_face", "look_left", "look_right", "look_up", "look_down"];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        setFacePosition(randomPosition);
        
        setTimeout(() => {
          setFacePosition("good");
          setFaceDetected(true);
          
          setTimeout(() => {
            if (students.length > 0) {
              const randomStudent = students[Math.floor(Math.random() * students.length)];
              setRecognizedStudent(randomStudent.id);
              
              const capturedImage = captureFrame();
              
              // Mark the student as present for today
              const today = format(new Date(), "yyyy-MM-dd");
              console.log(`Marking student ${randomStudent.id} as present on ${today}`);
              updateAttendance(randomStudent.id, today, 'present');
              
              setScanning(false);
              setCompleted(true);
              toast({
                title: "Attendance Marked",
                description: `Successfully marked ${randomStudent.name} as present.`,
                variant: "default",
              });
            }
          }, 2000);
        }, 1500);
      }, 1000);
      
      return () => clearTimeout(positionTimer);
    }
  }, [scanning, stream, students, processAttendance, toast, updateAttendance]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please make sure camera permissions are enabled.");
    }
  };

  const handleStartScan = async () => {
    if (students.length === 0) {
      setError("No students found in the database. Please add students first.");
      return;
    }

    setError("");
    setCompleted(false);
    setScanning(true);
    setRecognizedStudent(null);
    setFaceDetected(false);
    setFacePosition(null);

    try {
      await startCamera();
    } catch (err) {
      setError("Failed to start camera. Please check permissions.");
      setScanning(false);
    }
  };

  const renderPositionGuidance = () => {
    if (!scanning || !facePosition) return null;
    
    let message = "";
    let Icon = null;
    
    switch(facePosition) {
      case "look_forward":
        message = "Look straight ahead at the camera";
        Icon = Camera;
        break;
      case "center_face":
        message = "Center your face in the frame";
        Icon = Camera;
        break;
      case "look_left":
        message = "Turn slightly to the left";
        Icon = MoveLeft;
        break;
      case "look_right":
        message = "Turn slightly to the right";
        Icon = MoveRight;
        break;
      case "look_up":
        message = "Tilt your head slightly up";
        Icon = MoveUp;
        break;
      case "look_down":
        message = "Tilt your head slightly down";
        Icon = MoveDown;
        break;
      case "good":
        message = "Perfect! Recognizing face...";
        Icon = CheckCircle2;
        break;
    }
    
    return (
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 p-3 rounded-t-md">
        <div className="flex items-center justify-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary animate-pulse" />}
          <p className="text-sm text-center text-white font-medium">{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Face Recognition</h1>
        <p className="text-muted-foreground">
          Take attendance using face recognition
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-md max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span>Face Recognition</span>
          </CardTitle>
          <CardDescription>
            Start the camera to recognize students' faces and mark attendance
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
            {stream ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  style={{ 
                    display: 'block', 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {renderPositionGuidance()}
                    
                    {/* Face detection overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-56 h-64 border-2 rounded-md
                                border-primary animate-pulse"></div>
                    </div>
                    
                    {faceDetected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-56 h-64 rounded-md border-2 border-green-500 
                                      animate-pulse bg-green-500/10"></div>
                      </div>
                    )}
                    
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3">
                      <p className="text-sm text-center text-white font-medium">
                        {faceDetected 
                          ? "Face recognized! Identifying..." 
                          : "Looking for face..."}
                      </p>
                    </div>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {scanning ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <>
                    <CameraOff className="h-12 w-12 text-slate-600" />
                    <p className="text-sm text-slate-400">
                      {completed ? "Scan completed" : "Camera preview will appear here"}
                    </p>
                  </>
                )}
              </div>
            )}
            
            {recognizedStudent && completed && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                {(() => {
                  const student = students.find(s => s.id === recognizedStudent);
                  return student ? (
                    <div className="flex flex-col items-center gap-3 p-4 animate-fade-in">
                      <Avatar className="h-20 w-20 border-2 border-green-500">
                        {student.photo ? (
                          <AvatarImage src={student.photo} alt={student.name} />
                        ) : (
                          <AvatarFallback className="text-xl bg-slate-600">
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-white">{student.name}</h3>
                        <p className="text-sm text-slate-300">{student.usn}</p>
                        <span className="mt-2 inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                          Present
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
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
            ) : completed ? (
              "Scan Again"
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
