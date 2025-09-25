import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useAttendance } from "@/context/AttendanceContext";
import { eyeRecognitionService } from "@/utils/faceVerification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, CheckCircle2, Loader2, CameraOff, User, UserX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const FaceRecognition = () => {
  const { students, updateAttendance } = useData();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [eyesDetected, setEyesDetected] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<{
    type: 'present' | 'absent' | null;
    student?: any;
    timestamp?: string;
  }>({ type: null });
  const [eyeBounds, setEyeBounds] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const SIMILARITY_THRESHOLD = 0.6; // As specified in requirements

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

  // Simulate eye detection with bounding box
  useEffect(() => {
    if (!isScanning || !stream || !videoRef.current) return;

    const video = videoRef.current;
    
    const simulateEyeDetection = () => {
      // Simulate eye detection - in production, this would use actual eye detection
      const hasEyes = Math.random() > 0.3; // 70% chance of detecting eyes
      
      if (hasEyes) {
        const videoRect = video.getBoundingClientRect();
        const centerX = videoRect.width / 2;
        const centerY = videoRect.height / 3; // Eyes are typically in upper third of face
        const eyeWidth = Math.min(videoRect.width * 0.35, 120); // Eyes are wider
        const eyeHeight = Math.min(videoRect.height * 0.15, 40); // Eyes are shorter
        
        setEyeBounds({
          x: centerX - eyeWidth / 2,
          y: centerY - eyeHeight / 2,
          width: eyeWidth,
          height: eyeHeight
        });
        setEyesDetected(true);
      } else {
        setEyeBounds(null);
        setEyesDetected(false);
      }
    };

    const interval = setInterval(simulateEyeDetection, 100);
    
    return () => clearInterval(interval);
  }, [isScanning, stream]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.readyState >= 2) {
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;
        
        if (videoWidth === 0 || videoHeight === 0) {
          return null;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        try {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.95);
        } catch (error) {
          console.error('Error capturing frame:', error);
          return null;
        }
      }
    }
    return null;
  };

  const performEyeRecognition = async () => {
    if (!eyesDetected) {
      setRecognitionResult({ type: 'absent' });
      toast({
        title: "No Eyes Detected",
        description: "❌ Attendance could not be verified. Marked Absent.",
        variant: "destructive",
      });
      return;
    }

    const capturedImage = captureFrame();
    if (!capturedImage) {
      setRecognitionResult({ type: 'absent' });
      toast({
        title: "Capture Failed",
        description: "❌ Attendance could not be verified. Marked Absent.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Initialize eye recognition service
      await eyeRecognitionService.initialize();

      const studentsWithPhotos = students.filter(s => s.photo);
      
      if (studentsWithPhotos.length === 0) {
        setRecognitionResult({ type: 'absent' });
        toast({
          title: "No Student Photos",
          description: "❌ No student photos found in database.",
          variant: "destructive",
        });
        return;
      }

      // Convert students to StoredPerson format
      const storedPersons = studentsWithPhotos.map(student => ({
        id: student.id,
        name: student.name,
        role: 'student',
        image: student.photo,
        faceEmbedding: undefined as number[] | undefined
      }));

      // Create detected eyes object
      const detectedEyes = {
        id: 1,
        x: 100,
        y: 80, // Eyes are higher up
        width: 120, // Eyes are wider
        height: 40,  // Eyes are shorter
        confidence: 0.9,
        embedding: undefined as number[] | undefined,
        verifiedPerson: undefined
      };

      // Generate embedding from captured image
      const embedding = await eyeRecognitionService.generateEyeEmbedding(capturedImage);
      detectedEyes.embedding = embedding;

      // Verify eyes against stored persons
      const verifiedEyes = await eyeRecognitionService.verifyEyesAsync([detectedEyes], storedPersons);
      const verifiedEye = verifiedEyes[0];

      if (verifiedEye.verifiedPerson && verifiedEye.verifiedPerson.confidence >= SIMILARITY_THRESHOLD) {
        // Match found - mark present
        const student = students.find(s => s.id === verifiedEye.verifiedPerson!.id);
        const today = format(new Date(), "yyyy-MM-dd");
        const timestamp = format(new Date(), "HH:mm:ss");
        
        updateAttendance(verifiedEye.verifiedPerson.id, today, 'present');
        
        setRecognitionResult({
          type: 'present',
          student: student,
          timestamp: timestamp
        });

        toast({
          title: "Attendance Marked",
          description: `✅ Attendance marked Present for ${student?.name}`,
          variant: "default",
        });
      } else {
        // No match - mark absent
        setRecognitionResult({ type: 'absent' });
        toast({
          title: "Eyes Not Recognized",
          description: "❌ Attendance could not be verified. Marked Absent.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Eye recognition error:', error);
      setRecognitionResult({ type: 'absent' });
      toast({
        title: "Recognition Failed",
        description: "❌ Attendance could not be verified. Marked Absent.",
        variant: "destructive",
      });
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
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStartRecognition = async () => {
    if (students.length === 0) {
      toast({
        title: "No Students Found", 
        description: "Please upload student data first.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setRecognitionResult({ type: null });
    setEyesDetected(false);
    setEyeBounds(null);

    if (!stream) {
      await startCamera();
    }
    
    // Start recognition after a short delay to ensure camera is ready
    setTimeout(() => {
      performEyeRecognition();
      setIsScanning(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Face Recognition Interface */}
        <Card className="bg-slate-800 border-slate-700 shadow-xl">
          <CardContent className="space-y-4">
            {/* Camera Feed */}
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
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
                  
                  {/* Face Detection Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative">
                      {/* Face Guide Circle */}
                      <div className="w-64 h-64 border-2 border-white/30 rounded-full flex items-center justify-center">
                        <div className="text-white/70 text-sm font-medium">Position your face here</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center">
                      <div className="bg-blue-900/80 text-blue-100 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scanning Face...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Green Bounding Box for Detected Eyes */}
                  {eyeBounds && eyesDetected && !isScanning && (
                    <div 
                      className="absolute border-2 border-green-400 rounded-md bg-green-400/10"
                      style={{
                        left: `${eyeBounds.x}px`,
                        top: `${eyeBounds.y}px`,
                        width: `${eyeBounds.width}px`,
                        height: `${eyeBounds.height}px`
                      }}
                    >
                      <div className="absolute -top-6 left-0 text-xs text-green-400 font-semibold bg-green-900/80 px-2 py-1 rounded">
                        Eyes Detected
                      </div>
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  {isScanning ? (
                    <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
                  ) : (
                    <>
                      <CameraOff className="h-16 w-16 text-slate-600 mb-4" />
                      <p className="text-slate-400">Position your face for scanning</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleStartRecognition} 
              disabled={isScanning}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Start Face Scan"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Recognition Results */}
        {recognitionResult.type && (
          <Card className={`border-2 shadow-xl ${recognitionResult.type === 'present' 
            ? 'bg-green-900/20 border-green-600' 
            : 'bg-red-900/20 border-red-600'
          }`}>
            <CardContent className="p-6">
              {recognitionResult.type === 'present' && recognitionResult.student ? (
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-green-500">
                      {recognitionResult.student.photo ? (
                        <AvatarImage src={recognitionResult.student.photo} alt={recognitionResult.student.name} />
                      ) : (
                        <AvatarFallback className="bg-green-700 text-green-100">
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-bold text-green-400">Present</h3>
                    </div>
                    <p className="text-green-300 text-lg">
                      {recognitionResult.student.name} - {recognitionResult.student.usn}
                    </p>
                    <p className="text-green-300 text-sm">
                      Marked at {recognitionResult.timestamp}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-red-700 flex items-center justify-center border-2 border-red-500">
                      <UserX className="h-8 w-8 text-red-100" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                      <h3 className="text-xl font-bold text-red-400">Absent</h3>
                    </div>
                    <p className="text-red-300 text-lg">
                      Face not recognized
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FaceRecognition;
