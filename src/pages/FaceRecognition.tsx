import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useAttendance } from "@/context/AttendanceContext";
import { faceVerificationService } from "@/utils/faceVerification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, CheckCircle2, Loader2, CameraOff, User, MoveLeft, MoveRight, MoveUp, MoveDown, UserX, Shield } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const FaceRecognition = () => {
  const { students, processAttendance, updateAttendance } = useData();
  const { getTodayAttendance } = useAttendance();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recognizedStudent, setRecognizedStudent] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<string | null>(null);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement>(null);
  const [faceBounds, setFaceBounds] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [faceScores, setFaceScores] = useState<{[studentId: string]: number}>({});
  const [matchConfidence, setMatchConfidence] = useState(0);
  const [stableMatches, setStableMatches] = useState(0);
  const [lastMatchedId, setLastMatchedId] = useState<string | null>(null);
  const [consecutiveMatches, setConsecutiveMatches] = useState<{[studentId: string]: number}>({});
  
  const MAX_CAPTURES = 20;
  const CONFIDENCE_THRESHOLD = 75;
  const STABLE_MATCHES_REQUIRED = 4;
  const CONSECUTIVE_MATCHES_REQUIRED = 3;

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

  useEffect(() => {
    if (!scanning || !stream || !videoRef.current) return;

    const video = videoRef.current;
    
    const simulateFaceDetection = () => {
      // Get video dimensions
      const videoRect = video.getBoundingClientRect();
      const centerX = videoRect.width / 2;
      const centerY = videoRect.height / 2;
      const faceWidth = videoRect.width * 0.3;
      const faceHeight = videoRect.height * 0.4;
      
      return {
        x: centerX - faceWidth / 2,
        y: centerY - faceHeight / 2,
        width: faceWidth,
        height: faceHeight
      };
    };

    const updateFaceDetection = () => {
      if (!video) return;
      
      const faceRect = simulateFaceDetection();
      setFaceBounds(faceRect);
      
      animationId = requestAnimationFrame(updateFaceDetection);
    };
    
    let animationId = requestAnimationFrame(updateFaceDetection);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [scanning, stream]);

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

  const verifyFaceAgainstDatabase = async (capturedImage: string | null): Promise<{ isVerified: boolean, studentId: string | null, confidence: number }> => {
    if (students.length === 0) {
      return { isVerified: false, studentId: null, confidence: 0 };
    }

    // Initialize face verification service
    await faceVerificationService.initialize();

    const studentsWithPhotos = students.filter(s => s.photo);
    
    if (studentsWithPhotos.length === 0) {
      return { isVerified: false, studentId: null, confidence: 0 };
    }

    try {
      // Convert students to StoredPerson format for face verification
      const storedPersons = studentsWithPhotos.map(student => ({
        id: student.id,
        name: student.name,
        role: 'student',
        image: student.photo,
        faceEmbedding: undefined as number[] | undefined
      }));

      console.log(`Face Recognition: Attempting to match against ${storedPersons.length} students with photos`);
      storedPersons.forEach((person, index) => {
        console.log(`Student ${index + 1}: ${person.name} (ID: ${person.id}) - Has photo: ${!!person.image}`);
      });

      // Create a detected face from the captured image (simulate detection bounds)
      const detectedFace = {
        id: 1,
        x: 100,
        y: 100, 
        width: 150,
        height: 200,
        confidence: 0.9,
        embedding: undefined as number[] | undefined,
        verifiedPerson: undefined
      };

      // Generate embedding from captured image if available
      if (capturedImage) {
        try {
          const embedding = await faceVerificationService.generateFaceEmbedding(capturedImage);
          detectedFace.embedding = embedding;
        } catch (error) {
          console.warn('Failed to generate embedding from captured image:', error);
          detectedFace.embedding = faceVerificationService.generateFaceEmbeddingSync(detectedFace);
        }
      } else {
        detectedFace.embedding = faceVerificationService.generateFaceEmbeddingSync(detectedFace);
      }

      // Verify the face against stored persons
      const verifiedFaces = await faceVerificationService.verifyFacesAsync([detectedFace], storedPersons);
      const verifiedFace = verifiedFaces[0];

      if (verifiedFace.verifiedPerson) {
        const confidence = verifiedFace.verifiedPerson.confidence * 100; // Convert to percentage
        console.log(`Manual Face Recognition: Successfully matched ${verifiedFace.verifiedPerson.name} with ${confidence.toFixed(1)}% confidence`);
        
        return {
          isVerified: confidence >= 50, // Lower threshold for better matching
          studentId: verifiedFace.verifiedPerson.id,
          confidence: confidence
        };
      }

      console.log('Manual Face Recognition: No match found for captured face');
      return { isVerified: false, studentId: null, confidence: 0 };

    } catch (error) {
      console.error('Face verification error:', error);
      return { isVerified: false, studentId: null, confidence: 0 };
    }
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
          
          let captureAttempts = 0;
          const MAX_ATTEMPTS = MAX_CAPTURES;
          
          const captureAndVerify = async () => {
            if (!scanning) return;
            
            captureAttempts++;
            setCaptureCount(captureAttempts);
            
            // Force stop if exceeded attempts
            if (captureAttempts > MAX_ATTEMPTS) {
              console.log('Max attempts reached, stopping verification');
              setVerificationFailed(true);
              setScanning(false);
              setCompleted(true);
              
              toast({
                title: "Verification Failed",
                description: "Could not match your face after maximum attempts. Please try again or check student database.",
                variant: "destructive",
              });
              return;
            }
            
            const capturedImage = captureFrame();
            
            try {
              const { isVerified, studentId, confidence } = await verifyFaceAgainstDatabase(capturedImage);
              setMatchConfidence(confidence);
              
              console.log(`Attempt ${captureAttempts}: Confidence ${confidence}%`);
              
              // Lower threshold for matching - if we get decent confidence, accept it
              if (isVerified && studentId && confidence >= 30) {
                // Check if already marked by CCTV today
                const todayAttendance = getTodayAttendance();
                const existingCCTVRecord = todayAttendance.find(record => 
                  record.personId === studentId && 
                  record.cameraId && 
                  record.cameraId !== 'manual' && 
                  record.verified
                );
                
                setRecognizedStudent(studentId);
                
                const today = format(new Date(), "yyyy-MM-dd");
                console.log(`Marking student ${studentId} as present on ${today}`);
                updateAttendance(studentId, today, 'present');
                
                setScanning(false);
                setCompleted(true);
                setVerificationFailed(false);
                
                const student = students.find(s => s.id === studentId);
                
                if (existingCCTVRecord) {
                  toast({
                    title: "Manual Verification Complete",
                    description: `${student?.name} verified manually (already recorded via CCTV from ${existingCCTVRecord.cameraName}).`,
                    variant: "default",
                  });
                } else {
                  toast({
                    title: "Attendance Marked",
                    description: `Successfully verified and marked ${student?.name} as present with ${confidence.toFixed(1)}% confidence.`,
                    variant: "default",
                  });
                }
                return;
              }
              
              // Continue trying if not reached max attempts
              if (captureAttempts < MAX_ATTEMPTS) {
                setTimeout(captureAndVerify, 500);
              }
              
            } catch (error) {
              console.error("Face verification error:", error);
              
              // Continue trying unless max attempts reached
              if (captureAttempts < MAX_ATTEMPTS) {
                setTimeout(captureAndVerify, 500);
              } else {
                setError("Face verification service failed. Please try again.");
                setScanning(false);
                setCompleted(true);
                setVerificationFailed(true);
              }
            }
          };
          
          captureAndVerify();
        }, 1500);
      }, 1000);
      
      return () => clearTimeout(positionTimer);
    }
  }, [scanning, stream, students, captureCount, faceScores, stableMatches, lastMatchedId, consecutiveMatches, processAttendance, toast, updateAttendance, getTodayAttendance]);

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

    // Check if any students already have CCTV attendance today
    const todayAttendance = getTodayAttendance();
    const cctvMarkedStudents = todayAttendance.filter(record => 
      record.cameraId && record.cameraId !== 'manual' && record.verified
    );

    if (cctvMarkedStudents.length > 0) {
      toast({
        title: "CCTV Priority Notice",
        description: `${cctvMarkedStudents.length} student(s) already marked via CCTV today. Manual verification available as backup.`,
        variant: "default",
      });
    }

    setError("");
    setCompleted(false);
    setScanning(true);
    setRecognizedStudent(null);
    setFaceDetected(false);
    setFacePosition(null);
    setVerificationFailed(false);
    setFaceBounds(null);
    setCaptureCount(0);
    setFaceScores({});
    setMatchConfidence(0);
    setStableMatches(0);
    setLastMatchedId(null);
    setConsecutiveMatches({});

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
        message = "Look directly at the camera";
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
          Take attendance using face recognition (Manual backup for CCTV system)
        </p>
        
        {/* CCTV Priority Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">CCTV Priority System</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            CCTV cameras automatically detect and mark attendance. Use manual verification only when CCTV coverage is unavailable.
          </p>
        </div>
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
          
          {completed && verificationFailed && (
            <div className="flex items-center gap-2 rounded-md bg-amber-900/20 p-3 text-amber-400">
              <UserX className="h-5 w-5" />
              <span>Face detected but couldn't be matched to any student in the database.</span>
            </div>
          )}
          
          {completed && !verificationFailed && recognizedStudent && (
            <div className="flex items-center gap-2 rounded-md bg-green-900/20 p-3 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>Student verified and attendance marked successfully!</span>
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
                    display: 'block'
                  }}
                />
                
                <canvas
                  ref={blurCanvasRef}
                  className="hidden"
                />
                
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {renderPositionGuidance()}
                    
                    {faceBounds && (
                      <div 
                        className="absolute border-2 border-white/60 rounded-md"
                        style={{
                          left: `${(faceBounds.x / 640) * 100}%`,
                          top: `${(faceBounds.y / 480) * 100}%`,
                          width: `${(faceBounds.width / 640) * 100}%`,
                          height: `${(faceBounds.height / 480) * 100}%`
                        }}
                      />
                    )}
                    
                    {!faceBounds && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-56 h-64 border-2 rounded-md
                                    border-primary animate-pulse"></div>
                      </div>
                    )}
                    
                    {faceDetected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-56 h-64 rounded-md border-2 border-green-500 
                                      animate-pulse bg-green-500/10"></div>
                      </div>
                    )}
                    
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3">
                      <p className="text-sm text-center text-white font-medium">
                        {faceDetected 
                          ? `Face recognized! Verifying student identity... (${captureCount} of ${MAX_CAPTURES} captures, ${matchConfidence.toFixed(1)}% confidence)` 
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
            
            {completed && recognizedStudent && !verificationFailed && (
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
            
            {completed && verificationFailed && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-3 p-4 animate-fade-in">
                  <div className="h-20 w-20 rounded-full border-2 border-amber-500 flex items-center justify-center bg-slate-800">
                    <UserX className="h-10 w-10 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Verification Failed</h3>
                    <p className="text-sm text-slate-300 mt-1">Face doesn't match any student in the database</p>
                  </div>
                </div>
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
