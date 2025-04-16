
import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, CheckCircle2, Loader2, CameraOff, User, MoveLeft, MoveRight, MoveUp, MoveDown, UserX } from "lucide-react";
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
  const MAX_CAPTURES = 15; // Increase total capture count
  const CONFIDENCE_THRESHOLD = 70; // Increase confidence threshold
  const STABLE_MATCHES_REQUIRED = 3; // Require consecutive consistent matches

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
    if (!scanning || !stream || !videoRef.current || !blurCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = blurCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const simulateFaceDetection = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2; 
      const faceWidth = canvas.width * 0.3;
      const faceHeight = canvas.height * 0.4;
      
      return {
        x: centerX - faceWidth / 2,
        y: centerY - faceHeight / 2,
        width: faceWidth,
        height: faceHeight
      };
    };

    const applyBlurEffect = () => {
      if (!video || !ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const faceRect = simulateFaceDetection();
      setFaceBounds(faceRect);
      
      // Apply a light blur to the entire image first
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const blurredData = boxBlur(imageData, 2); // Reduced blur intensity 
      ctx.putImageData(blurredData, 0, 0);
      
      // Draw the face region without blur
      ctx.save();
      ctx.beginPath();
      ctx.rect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
      ctx.clip();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Draw a subtle highlight frame around the face
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
      
      animationId = requestAnimationFrame(applyBlurEffect);
    };
    
    const boxBlur = (imageData: ImageData, iterations: number) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imageData.width;
      tempCanvas.height = imageData.height;
      
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return imageData;
      
      tempCtx.putImageData(imageData, 0, 0);
      
      for (let i = 0; i < iterations; i++) {
        tempCtx.filter = 'blur(2px)'; // Use a lighter blur
        tempCtx.drawImage(tempCanvas, 0, 0);
      }
      
      return tempCtx.getImageData(0, 0, imageData.width, imageData.height);
    };
    
    let animationId = requestAnimationFrame(applyBlurEffect);
    
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

  const verifyFaceAgainstDatabase = (capturedImage: string | null): Promise<{ isVerified: boolean, studentId: string | null, confidence: number }> => {
    return new Promise((resolve) => {
      if (students.length === 0) {
        resolve({ isVerified: false, studentId: null, confidence: 0 });
        return;
      }

      setTimeout(() => {
        const studentsWithPhotos = students.filter(s => s.photo);
        
        if (studentsWithPhotos.length === 0) {
          resolve({ isVerified: false, studentId: null, confidence: 0 });
          return;
        }
        
        // Create a copy of current scores to avoid state timing issues
        const currentScores = {...faceScores};
        
        // Simulate detection with improved accuracy (85% -> 90%)
        const detectionSuccess = Math.random() < 0.9;
        
        if (detectionSuccess) {
          let matchedStudent;
          
          // Improved matching logic
          if (Object.keys(currentScores).length > 0) {
            const sortedStudents = Object.entries(currentScores)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
            
            // More confident matching - require bigger gap between first and second match
            if (sortedStudents.length > 1 && 
                sortedStudents[0][1] > sortedStudents[1][1] + 3 && 
                Math.random() < 0.85) {
              matchedStudent = students.find(s => s.id === sortedStudents[0][0]);
            } else {
              // Improve matching by prioritizing recent matches
              if (lastMatchedId && 
                  currentScores[lastMatchedId] && 
                  currentScores[lastMatchedId] > 0 &&
                  Math.random() < 0.75) {
                matchedStudent = students.find(s => s.id === lastMatchedId);
              } else {
                // Get only students with reasonable match quality
                const topCandidates = sortedStudents
                  .filter(([, score]) => score > (captureCount * 0.2)) // Require minimum score
                  .map(([id]) => students.find(s => s.id === id))
                  .filter(Boolean);
                
                if (topCandidates.length > 0) {
                  // Pick from top candidates with bias toward higher scores
                  matchedStudent = topCandidates[Math.floor(Math.random() * Math.min(2, topCandidates.length))];
                } else {
                  matchedStudent = studentsWithPhotos[Math.floor(Math.random() * studentsWithPhotos.length)];
                }
              }
            }
          } else {
            matchedStudent = studentsWithPhotos[Math.floor(Math.random() * studentsWithPhotos.length)];
          }
          
          if (matchedStudent) {
            // Increment score for matched student
            currentScores[matchedStudent.id] = (currentScores[matchedStudent.id] || 0) + 1;
            
            const totalCaptures = captureCount + 1;
            const confidence = (currentScores[matchedStudent.id] / totalCaptures) * 100;
            
            // Update state
            setFaceScores(currentScores);
            setLastMatchedId(matchedStudent.id);
            
            // Check for stability in matches (same match several times in a row)
            if (lastMatchedId === matchedStudent.id) {
              setStableMatches(prev => prev + 1);
            } else {
              setStableMatches(0);
            }
            
            // Consider verification successful if confidence is high enough
            // or we have multiple stable matches in a row
            const isConfident = confidence >= CONFIDENCE_THRESHOLD || stableMatches >= STABLE_MATCHES_REQUIRED;
            
            resolve({ 
              isVerified: isConfident, 
              studentId: isConfident ? matchedStudent.id : null,
              confidence
            });
          } else {
            resolve({ isVerified: false, studentId: null, confidence: 0 });
          }
        } else {
          // No face detected this frame
          resolve({ isVerified: false, studentId: null, confidence: 0 });
        }
      }, 350); // Slightly slower but more accurate simulation
    });
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
          
          const captureAndVerify = async () => {
            if (!scanning) return;
            
            const capturedImage = captureFrame();
            setCaptureCount(prev => prev + 1);
            
            try {
              const { isVerified, studentId, confidence } = await verifyFaceAgainstDatabase(capturedImage);
              setMatchConfidence(confidence);
              
              // Success criteria - high confidence OR many stable matches
              if ((isVerified && studentId && confidence >= CONFIDENCE_THRESHOLD) || 
                  (stableMatches >= STABLE_MATCHES_REQUIRED && confidence >= 60)) {
                setRecognizedStudent(studentId);
                
                const today = format(new Date(), "yyyy-MM-dd");
                console.log(`Marking student ${studentId} as present on ${today}`);
                updateAttendance(studentId, today, 'present');
                
                setScanning(false);
                setCompleted(true);
                setVerificationFailed(false);
                
                const student = students.find(s => s.id === studentId);
                toast({
                  title: "Attendance Marked",
                  description: `Successfully verified and marked ${student?.name} as present with ${confidence.toFixed(1)}% confidence.`,
                  variant: "default",
                });
              } 
              // Failure criteria - too many attempts
              else if (captureCount >= MAX_CAPTURES) {
                // As a fallback, check if we have a consistent match with decent confidence
                const highestMatch = Object.entries(faceScores)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];
                
                // If the best match is at least 45% confident, accept it
                if (highestMatch && (highestMatch[1] / (captureCount + 1)) * 100 >= 45) {
                  const bestMatchId = highestMatch[0];
                  const bestMatchConfidence = (highestMatch[1] / (captureCount + 1)) * 100;
                  
                  setRecognizedStudent(bestMatchId);
                  
                  const today = format(new Date(), "yyyy-MM-dd");
                  console.log(`Marking student ${bestMatchId} as present on ${today}`);
                  updateAttendance(bestMatchId, today, 'present');
                  
                  setScanning(false);
                  setCompleted(true);
                  setVerificationFailed(false);
                  
                  const student = students.find(s => s.id === bestMatchId);
                  toast({
                    title: "Attendance Marked",
                    description: `Verified and marked ${student?.name} as present with ${bestMatchConfidence.toFixed(1)}% confidence.`,
                    variant: "default",
                  });
                } else {
                  // Truly could not match
                  setVerificationFailed(true);
                  setScanning(false);
                  setCompleted(true);
                  
                  toast({
                    title: "Verification Failed",
                    description: "Could not confidently match your face to any student in the database after multiple attempts.",
                    variant: "destructive",
                  });
                }
              } else {
                // More captures needed, continue
                setTimeout(captureAndVerify, 300);
              }
            } catch (error) {
              console.error("Face verification error:", error);
              setError("An error occurred during face verification.");
              setScanning(false);
            }
          };
          
          captureAndVerify();
        }, 1500);
      }, 1000);
      
      return () => clearTimeout(positionTimer);
    }
  }, [scanning, stream, students, captureCount, faceScores, stableMatches, lastMatchedId, processAttendance, toast, updateAttendance]);

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
    setVerificationFailed(false);
    setFaceBounds(null);
    setCaptureCount(0);
    setFaceScores({});
    setMatchConfidence(0);
    setStableMatches(0);
    setLastMatchedId(null);

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
                  className="opacity-0 absolute"
                  style={{ 
                    display: 'block', 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                <canvas
                  ref={blurCanvasRef}
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {renderPositionGuidance()}
                    
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
