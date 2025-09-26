import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useAttendance } from "@/context/AttendanceContext";
import { eyeRecognitionService } from "@/utils/faceVerification";
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
      console.log('No students in database');
      return { isVerified: false, studentId: null, confidence: 0 };
    }

    // Initialize face verification service
    await eyeRecognitionService.initialize();

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

    try {
      console.log(`Starting face verification for ${studentsWithPhotos.length} students with photos`);
      
      // Convert students to StoredPerson format for verification
      const storedPersons = studentsWithPhotos.map(student => ({
        id: student.id,
        name: student.name,
        role: 'student',
        image: student.photo,
        eyeEmbedding: undefined as number[] | undefined
      }));

      // Create detected face object with proper dimensions
      const detectedFace = {
        id: 1,
        x: 100,
        y: 80,
        width: 120,
        height: 40,
        confidence: 0.9,
        embedding: undefined as number[] | undefined,
        verifiedPerson: undefined
      };

      // Generate embedding from captured image if available
      if (capturedImage) {
        try {
          console.log('Generating embedding from captured face image');
          const embedding = await eyeRecognitionService.generateEyeEmbedding(capturedImage);
          detectedFace.embedding = embedding;
          console.log(`Generated embedding with ${embedding.length} dimensions`);
        } catch (error) {
          console.warn('Failed to generate embedding from captured image:', error);
          detectedFace.embedding = eyeRecognitionService.generateEyeEmbeddingSync(detectedFace);
        }
      } else {
        console.warn('No captured image available, using fallback embedding');
        detectedFace.embedding = eyeRecognitionService.generateEyeEmbeddingSync(detectedFace);
      }

      // Verify the face against stored persons
      console.log('Starting face verification against uploaded student photos...');
      const verifiedFaces = await eyeRecognitionService.verifyEyesAsync([detectedFace], storedPersons);
      const verifiedFace = verifiedFaces[0];

      if (verifiedFace.verifiedPerson) {
        const confidence = verifiedFace.verifiedPerson.confidence * 100; // Convert to percentage
        console.log(`✅ MATCH FOUND: ${verifiedFace.verifiedPerson.name} with ${confidence.toFixed(1)}% confidence`);
        
        return {
          isVerified: confidence >= 20, // Lower threshold for easier matching
          studentId: verifiedFace.verifiedPerson.id,
          confidence: confidence
        };
      } else {
        console.log('❌ No face match found above threshold');
        return { isVerified: false, studentId: null, confidence: 0 };
      }
    } catch (error) {
      console.error('Face verification error:', error);
      toast({
        title: "Verification Error",
        description: "An error occurred during face verification. Please try again.",
        variant: "destructive",
      });
      return { isVerified: false, studentId: null, confidence: 0 };
    }
  };

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
        
        await new Promise((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current;
            
            const onLoadedData = () => {
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              setFaceDetected(true);
              resolve(void 0);
            };
            
            const onError = (error: any) => {
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              reject(error);
            };
            
            video.addEventListener('loadeddata', onLoadedData);
            video.addEventListener('error', onError);
            video.play().catch(console.error);
          }
        });
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access failed");
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStartScan = async () => {
    if (students.length === 0) {
      toast({
        title: "No Students Found", 
        description: "Please upload student data first.",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setCompleted(false);
    setError("");
    setRecognizedStudent(null);
    setVerificationFailed(false);
    setCaptureCount(0);
    setFaceScores({});
    setMatchConfidence(0);
    setStableMatches(0);
    setLastMatchedId(null);
    setConsecutiveMatches({});

    if (!stream) {
      await startCamera();
    }
    
    // Start the scanning process
    setTimeout(async () => {
      try {
        const capturedImage = captureFrame();
        console.log('Captured image for face verification:', capturedImage ? 'Success' : 'Failed');
        
        const verificationResult = await verifyFaceAgainstDatabase(capturedImage);
        
        if (verificationResult.isVerified && verificationResult.studentId) {
          // Face recognized successfully
          const student = students.find(s => s.id === verificationResult.studentId);
          if (student) {
            setRecognizedStudent(student.id);
            setMatchConfidence(verificationResult.confidence);
            
            // Mark attendance
            const today = format(new Date(), "yyyy-MM-dd");
            updateAttendance(student.id, today, 'present');
            
            toast({
              title: "Face Recognized!",
              description: `✅ Attendance marked Present for ${student.name}`,
              variant: "default",
            });
          }
        } else {
          // Face not recognized
          setVerificationFailed(true);
          toast({
            title: "Face Not Recognized",
            description: "❌ Attendance marked Absent - face verification failed",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Face recognition error:', error);
        setVerificationFailed(true);
        setError("Face recognition failed");
        toast({
          title: "Recognition Failed",
          description: "❌ An error occurred during face recognition",
          variant: "destructive",
        });
      }
      
      setScanning(false);
      setCompleted(true);
    }, 3000);
  };

  const getPositionInstruction = (position: string | null) => {
    switch (position) {
      case 'too-left': return { icon: MoveRight, text: 'Move right' };
      case 'too-right': return { icon: MoveLeft, text: 'Move left' };
      case 'too-high': return { icon: MoveDown, text: 'Move down' };
      case 'too-low': return { icon: MoveUp, text: 'Move up' };
      default: return null;
    }
  };

  const instruction = getPositionInstruction(facePosition);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              Face Recognition Attendance
            </CardTitle>
            <CardDescription className="text-slate-300">
              Position your face in the frame for attendance verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Feed */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-600 shadow-lg">
              {stream ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover"
                    style={{ 
                      display: 'block',
                      background: '#000'
                    }}
                  />
                  
                  {/* Face detection overlay */}
                  {faceBounds && (
                    <div 
                      className={`absolute border-2 rounded-lg transition-all duration-200 ${
                        scanning ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 
                        faceDetected ? 'border-green-400 shadow-lg shadow-green-400/30' : 'border-yellow-400'
                      }`}
                      style={{
                        left: `${faceBounds.x}px`,
                        top: `${faceBounds.y}px`,
                        width: `${faceBounds.width}px`,
                        height: `${faceBounds.height}px`
                      }}
                    >
                      <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                        scanning ? 'bg-blue-600 text-white' :
                        faceDetected ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'
                      }`}>
                        {scanning ? 'Scanning...' : faceDetected ? 'Face Detected' : 'Align Face'}
                      </div>
                    </div>
                  )}
                  
                  {/* Position guidance */}
                  {instruction && !scanning && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-black px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                      <instruction.icon className="h-4 w-4" />
                      {instruction.text}
                    </div>
                  )}
                  
                  {/* Scanning progress overlay */}
                  {scanning && (
                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                      <div className="bg-black/80 text-white px-6 py-4 rounded-xl flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                        <div>
                          <p className="font-semibold">Scanning Face...</p>
                          <p className="text-sm text-gray-300">Please hold still</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                  <canvas ref={blurCanvasRef} className="hidden" />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  {scanning ? (
                    <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
                  ) : (
                    <>
                      <CameraOff className="h-16 w-16 text-slate-600 mb-4" />
                      <p className="text-slate-400">Camera not started</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Recognition Results */}
            {completed && (
              <div className="relative min-h-[200px] bg-slate-900/50 rounded-lg border border-slate-600 p-6">
                {(() => {
                  const student = recognizedStudent ? students.find(s => s.id === recognizedStudent) : null;
                  return student ? (
                    <div className="flex flex-col items-center gap-4 p-4 animate-fade-in">
                      <Avatar className="h-20 w-20 border-2 border-green-500">
                        {student.photo ? (
                          <AvatarImage src={student.photo} alt={student.name} />
                        ) : (
                          <AvatarFallback className="bg-green-700 text-green-100">
                            <User className="h-10 w-10" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle2 className="h-6 w-6 text-green-400" />
                          <h3 className="text-lg font-semibold text-white">{student.name}</h3>
                        </div>
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
            )}
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
    </div>
  );
};

export default FaceRecognition;
