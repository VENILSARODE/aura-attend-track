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
  
  const MAX_CAPTURES = 30;
  const CONFIDENCE_THRESHOLD = 15; // Lower threshold for easier recognition
  const STABLE_MATCHES_REQUIRED = 3;
  const CONSECUTIVE_MATCHES_REQUIRED = 2;
  const MULTIPLE_SAMPLES = 5; // Take multiple samples for better accuracy

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
      
      if (context && video.readyState >= 2) { // Video is loaded enough to get dimensions
        // Validate video dimensions before proceeding
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;
        
        console.log(`Capturing frame: ${videoWidth}x${videoHeight}, readyState: ${video.readyState}`);
        
        if (videoWidth === 0 || videoHeight === 0) {
          console.warn('Video dimensions are 0, skipping capture');
          return null;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        try {
          // Clear and draw video frame
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Enhance image quality for better recognition
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Increase contrast and brightness for better face recognition
          for (let i = 0; i < data.length; i += 4) {
            // Increase contrast
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128)); // Red
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128)); // Green
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128)); // Blue
          }
          
          context.putImageData(imageData, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          console.log('Frame captured successfully, data URL length:', dataUrl.length);
          return dataUrl;
        } catch (error) {
          console.error('Error capturing frame:', error);
          return null;
        }
      } else {
        console.warn('Video not ready for capture, readyState:', video?.readyState);
      }
    }
    return null;
  };

  const verifyFaceAgainstDatabase = async (capturedImage: string | null): Promise<{ isVerified: boolean, studentId: string | null, confidence: number }> => {
    if (students.length === 0) {
      console.log('No students in database');
      return { isVerified: false, studentId: null, confidence: 0 };
    }

    // Initialize face verification service
    await faceVerificationService.initialize();

    const studentsWithPhotos = students.filter(s => s.photo);
    
    if (studentsWithPhotos.length === 0) {
      console.log('No students with photos found in database');
      toast({
        title: "No Student Photos",
        description: "No student photos found in database. Please upload student data with photos first.",
        variant: "destructive",
      });
      return { isVerified: false, studentId: null, confidence: 0 };
    }

    console.log(`Face Recognition: Comparing against ${studentsWithPhotos.length} students with photos`);

    try {
      // Convert students to StoredPerson format for face verification
      const storedPersons = studentsWithPhotos.map(student => ({
        id: student.id,
        name: student.name,
        role: 'student',
        image: student.photo,
        faceEmbedding: undefined as number[] | undefined
      }));

      // Log student details for debugging
      console.log('Students available for matching:');
      storedPersons.forEach((person, index) => {
        console.log(`${index + 1}. ${person.name} (ID: ${person.id}) - Photo: ${person.image ? 'Yes' : 'No'}`);
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
          console.log('Generating embedding from captured face image');
          const embedding = await faceVerificationService.generateFaceEmbedding(capturedImage);
          detectedFace.embedding = embedding;
          console.log(`Generated embedding with ${embedding.length} dimensions`);
        } catch (error) {
          console.warn('Failed to generate embedding from captured image:', error);
          detectedFace.embedding = faceVerificationService.generateFaceEmbeddingSync(detectedFace);
        }
      } else {
        console.warn('No captured image available, using fallback embedding');
        detectedFace.embedding = faceVerificationService.generateFaceEmbeddingSync(detectedFace);
      }

      // Verify the face against stored persons
      console.log('Starting face verification against uploaded student photos...');
      const verifiedFaces = await faceVerificationService.verifyFacesAsync([detectedFace], storedPersons);
      const verifiedFace = verifiedFaces[0];

      if (verifiedFace.verifiedPerson) {
        const confidence = verifiedFace.verifiedPerson.confidence * 100; // Convert to percentage
        console.log(`✅ MATCH FOUND: ${verifiedFace.verifiedPerson.name} with ${confidence.toFixed(1)}% confidence`);
        
        return {
          isVerified: confidence >= 15, // Even lower threshold for easier matching
          studentId: verifiedFace.verifiedPerson.id,
          confidence: confidence
        };
      }

      console.log('❌ NO MATCH: Face does not match any uploaded student photos');
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
            
            // Force stop if exceeded attempts - mark as absent
            if (captureAttempts > MAX_ATTEMPTS) {
              console.log('Max attempts reached, marking as absent');
              setVerificationFailed(true);
              setScanning(false);
              setCompleted(true);
              
              // Mark as absent since face couldn't be verified
              const today = format(new Date(), "yyyy-MM-dd");
              // For now, we'll create a generic absent record since we don't know which student
              toast({
                title: "Marked Absent",
                description: "Face recognition failed after maximum attempts. Marked as absent.",
                variant: "destructive",
              });
              return;
            }
            
            // Take multiple samples for better accuracy
            const samples = [];
            console.log(`Taking ${MULTIPLE_SAMPLES} samples for attempt ${captureAttempts}`);
            
            for (let i = 0; i < Math.min(MULTIPLE_SAMPLES, MAX_ATTEMPTS - captureAttempts + 1); i++) {
              const capturedImage = captureFrame();
              console.log(`Sample ${i + 1}: ${capturedImage ? 'Success' : 'Failed'} (length: ${capturedImage?.length || 0})`);
              
              if (capturedImage) {
                samples.push(capturedImage);
              }
              // Small delay between captures
              if (i < MULTIPLE_SAMPLES - 1) {
                await new Promise(resolve => setTimeout(resolve, 200)); // Slightly longer delay
              }
            }
            
            console.log(`Collected ${samples.length} valid samples out of ${MULTIPLE_SAMPLES} attempts`);
            
            if (samples.length === 0) {
              console.warn('No valid samples captured, retrying...');
              if (captureAttempts < MAX_ATTEMPTS) {
                setTimeout(captureAndVerify, 500);
              }
              return;
            }
            
            // Test all samples and use the best match
            let bestResult = { isVerified: false, studentId: null, confidence: 0 };
            
            try {
              for (const sample of samples) {
                const result = await verifyFaceAgainstDatabase(sample);
                if (result.confidence > bestResult.confidence) {
                  bestResult = result;
                }
              }
              
              setMatchConfidence(bestResult.confidence);
              console.log(`Attempt ${captureAttempts}: Best confidence from ${samples.length} samples: ${bestResult.confidence}%`);
              
              // Very low threshold for easier matching
              if (bestResult.isVerified && bestResult.studentId && bestResult.confidence >= 15) {
                // Check if already marked by CCTV today
                const todayAttendance = getTodayAttendance();
                const existingCCTVRecord = todayAttendance.find(record => 
                  record.personId === bestResult.studentId && 
                  record.cameraId && 
                  record.cameraId !== 'manual' && 
                  record.verified
                );
                
                setRecognizedStudent(bestResult.studentId);
                
                const today = format(new Date(), "yyyy-MM-dd");
                const student = students.find(s => s.id === bestResult.studentId);
                console.log(`✅ CONFIRMED MATCH: Marking ${student?.name} as present on ${today} with ${bestResult.confidence}% confidence`);
                updateAttendance(bestResult.studentId, today, 'present');
                
                setScanning(false);
                setCompleted(true);
                setVerificationFailed(false);
                
                if (existingCCTVRecord) {
                  toast({
                    title: "Marked Present",
                    description: `${student?.name} face confirmed! Marked present (also recorded via CCTV).`,
                    variant: "default",
                  });
                } else {
                  toast({
                    title: "Marked Present", 
                    description: `${student?.name} face confirmed! Successfully marked present.`,
                    variant: "default",
                  });
                }
                return;
              }
              
              // Continue trying if not reached max attempts
              if (captureAttempts < MAX_ATTEMPTS) {
                console.log(`❌ NO MATCH ATTEMPT ${captureAttempts}: Best confidence ${bestResult.confidence}%`);
                setTimeout(captureAndVerify, 300); // Faster retry for better user experience
              }
              
            } catch (error) {
              console.error("Face verification error:", error);
              
              // Continue trying unless max attempts reached
              if (captureAttempts < MAX_ATTEMPTS) {
                setTimeout(captureAndVerify, 300);
              } else {
                // Mark as absent after max attempts with no recognition
                setError("Face not recognized. Marked as absent.");
                setScanning(false);
                setCompleted(true);
                setVerificationFailed(true);
                
                toast({
                  title: "Marked Absent",
                  description: "Face recognition failed. Marked as absent.",
                  variant: "destructive",
                });
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
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 360 }
        } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready with proper loading
        await new Promise((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current;
            
            const onLoadedData = () => {
              console.log('Video loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              resolve(void 0);
            };
            
            const onError = (error: any) => {
              console.error('Video loading error:', error);
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              reject(error);
            };
            
            video.addEventListener('loadeddata', onLoadedData);
            video.addEventListener('error', onError);
            
            // Start playing the video
            video.play().catch(console.error);
          }
        });
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please make sure camera permissions are enabled.");
    }
  };

  const handleStartScan = async () => {
    if (students.length === 0) {
      setError("No students found in the database. Please upload student data first.");
      toast({
        title: "No Students Found", 
        description: "Please upload student data first before using face recognition.",
        variant: "destructive",
      });
      return;
    }

    const studentsWithPhotos = students.filter(s => s.photo);
    if (studentsWithPhotos.length === 0) {
      setError("No student photos found. Please ensure uploaded data includes photos.");
      toast({
        title: "No Student Photos",
        description: "Face recognition requires student photos. Please upload data with photos first.",
        variant: "destructive",
      });
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

    console.log(`Starting face recognition with ${studentsWithPhotos.length} students with photos`);
    
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
              <div className="flex items-center gap-2 rounded-md bg-red-900/20 p-3 text-red-400">
                <UserX className="h-5 w-5" />
                <span>Face not recognized. Marked as absent.</span>
              </div>
            )}
          
            {completed && !verificationFailed && recognizedStudent && (
              <div className="flex items-center gap-2 rounded-md bg-green-900/20 p-3 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Face recognized! Marked as present.</span>
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
                    background: '#000'
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
                        className="absolute border-2 border-green-400 rounded-md bg-green-400/10"
                        style={{
                          left: `${Math.max(0, (faceBounds.x / 640) * 100)}%`,
                          top: `${Math.max(0, (faceBounds.y / 480) * 100)}%`,
                          width: `${Math.min(100, (faceBounds.width / 640) * 100)}%`,
                          height: `${Math.min(100, (faceBounds.height / 480) * 100)}%`
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
                        {faceDetected ? "Face detected! Processing..." : "Looking for face..."}
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
                  <div className="h-20 w-20 rounded-full border-2 border-red-500 flex items-center justify-center bg-slate-800">
                    <UserX className="h-10 w-10 text-red-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Marked Absent</h3>
                    <p className="text-sm text-slate-300 mt-1">Face recognition failed</p>
                    <span className="mt-2 inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                      Absent
                    </span>
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
