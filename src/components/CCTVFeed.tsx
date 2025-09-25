import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Users, Maximize2, WifiOff, Check, X, UserCheck } from "lucide-react";
import { eyeRecognitionService, DetectedEyes, StoredPerson } from "@/utils/faceVerification";
import { useData } from "@/context/DataContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useToast } from "@/components/ui/use-toast";

interface Face {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  name?: string;
}

interface CCTVFeedProps {
  cameraName: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline";
  isLiveView?: boolean;
  cameraId?: string;
}

const CCTVFeed: React.FC<CCTVFeedProps> = ({ 
  cameraName, 
  ipAddress, 
  port, 
  status, 
  isLiveView = false,
  cameraId = "unknown"
}) => {
  const { students } = useData();
  const { markAttendance } = useAttendance();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(status === "online");
  const [eyes, setEyes] = useState<DetectedEyes[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize eye recognition service
  useEffect(() => {
    const initService = async () => {
      try {
        await eyeRecognitionService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize eye recognition:', error);
      }
    };
    
    if (status === "online") {
      initService();
    }
  }, [status]);

  // Convert stored data to person format for eye recognition
  const storedPersons: StoredPerson[] = students?.map(student => ({
    id: student.id.toString(),
    name: student.name,
    role: 'Student',
    image: student.photo, // Include the uploaded photo for eye matching
    eyeEmbedding: undefined // Will be generated on first use from the photo
  })) || [];
  
  // Simulate camera feed and face detection
  useEffect(() => {
    if (status === "offline" || !isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawFrame = async () => {
      // Simulate camera background (gradient to simulate video feed)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f172a');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add noise/grain effect to simulate video
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 10;
        data[i] += noise;     // Red
        data[i + 1] += noise; // Green  
        data[i + 2] += noise; // Blue
      }
      ctx.putImageData(imageData, 0, 0);

      // Simulate moving objects (people)
      const time = frameCount * 0.1;
      
      // Generate detected eyes
      const detectedEyes = eyeRecognitionService.detectEyesInFrame(frameCount, cameraId);
      
      // Verify eyes against stored data using async method for better accuracy
      const verifiedEyes = await eyeRecognitionService.verifyEyesAsync(detectedEyes, storedPersons);
      // Log eye detection and verification results for debugging
      if (detectedEyes.length > 0) {
        console.log(`CCTV ${cameraName}: Detected ${detectedEyes.length} eyes`);
        console.log(`Available students for matching: ${storedPersons.length}`);
        
        verifiedEyes.forEach((eyes, index) => {
          if (eyes.verifiedPerson) {
            console.log(`Eyes ${index + 1}: Matched to ${eyes.verifiedPerson.name} (${(eyes.verifiedPerson.confidence * 100).toFixed(1)}%)`);
          } else {
            console.log(`Eyes ${index + 1}: No match found (detection confidence: ${(eyes.confidence * 100).toFixed(1)}%)`);
          }
        });
      }

      // Draw eye detection rectangles and verification results
      verifiedEyes.forEach((eyes) => {
        const isVerified = !!eyes.verifiedPerson;
        
        // Eye bounding box - green for verified, yellow for unverified, red for low confidence
        if (isVerified) {
          ctx.strokeStyle = '#00ff00'; // Green for verified
        } else if (eyes.confidence > 0.7) {
          ctx.strokeStyle = '#ffaa00'; // Orange for unverified but confident detection
        } else {
          ctx.strokeStyle = '#ff0000'; // Red for low confidence
        }
        
        ctx.lineWidth = 2;
        ctx.strokeRect(eyes.x, eyes.y, eyes.width, eyes.height);

        // Verification indicator
        if (isVerified) {
          // Green checkmark for verified
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(eyes.x + eyes.width - 20, eyes.y, 20, 20);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(eyes.x + eyes.width - 16, eyes.y + 8);
          ctx.lineTo(eyes.x + eyes.width - 12, eyes.y + 12);
          ctx.lineTo(eyes.x + eyes.width - 6, eyes.y + 4);
          ctx.stroke();
        } else {
          // Red X for unverified
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(eyes.x + eyes.width - 20, eyes.y, 20, 20);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(eyes.x + eyes.width - 16, eyes.y + 4);
          ctx.lineTo(eyes.x + eyes.width - 6, eyes.y + 14);
          ctx.moveTo(eyes.x + eyes.width - 6, eyes.y + 4);
          ctx.lineTo(eyes.x + eyes.width - 16, eyes.y + 14);
          ctx.stroke();
        }

        // Eye label background
        const labelText = eyes.verifiedPerson 
          ? `${eyes.verifiedPerson.name} (${Math.round(eyes.verifiedPerson.confidence * 100)}%)`
          : `Unknown (${Math.round(eyes.confidence * 100)}%)`;
        
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillStyle = isVerified ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(eyes.x, eyes.y - 25, textWidth + 10, 20);

        // Eye label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, eyes.x + 5, eyes.y - 10);

        // Mark attendance for verified eyes
        if (isVerified && eyes.verifiedPerson && frameCount % 300 === 0) { // Every 10 seconds
          console.log(`CCTV: Verified ${eyes.verifiedPerson.name} with ${(eyes.verifiedPerson.confidence * 100).toFixed(1)}% confidence`);
          
          const attendanceRecord = markAttendance({
            personId: eyes.verifiedPerson.id,
            personName: eyes.verifiedPerson.name,
            role: eyes.verifiedPerson.role,
            timestamp: new Date(),
            cameraId: cameraId || `cctv-${ipAddress}:${port}`,
            cameraName: cameraName,
            confidence: eyes.verifiedPerson.confidence,
            verified: true
          });
          
          // Only show toast for new attendance records
          if (attendanceRecord && new Date().getTime() - new Date(attendanceRecord.timestamp).getTime() < 5000) {
            toast({
              title: "CCTV Attendance Marked",
              description: `${eyes.verifiedPerson.name} detected and marked present by ${cameraName}`,
            });
          }
        }
      });

      // Camera info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, canvas.height - 40, 200, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.fillText(`${ipAddress}:${port}`, 15, canvas.height - 25);
      ctx.fillText(`${new Date().toLocaleTimeString()}`, 15, canvas.height - 10);

      setFrameCount(prev => prev + 1);
      animationId = requestAnimationFrame(drawFrame);
    };

    animationId = requestAnimationFrame(drawFrame);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [status, isPlaying, frameCount, ipAddress, port]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (status === "offline") {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-2">
            <WifiOff className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Camera Offline</p>
          <p className="text-xs text-muted-foreground">{ipAddress}:{port}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={isLiveView ? 480 : 320}
          height={isLiveView ? 270 : 180}
          className="w-full h-full object-cover"
        />
        
        {/* Control overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={togglePlayPause}
            className="bg-black/50 hover:bg-black/70 text-white"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          {isLiveView && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Live indicator */}
        {isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium bg-black/50 px-1 rounded">LIVE</span>
          </div>
        )}

        {/* Eye count with verification status */}
        {eyes.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="secondary" className="bg-black/50 text-white">
              <Users className="h-3 w-3 mr-1" />
              {eyes.length}
            </Badge>
            {eyes.filter(f => f.verifiedPerson).length > 0 && (
              <Badge variant="default" className="bg-green-600/80 text-white">
                <UserCheck className="h-3 w-3 mr-1" />
                {eyes.filter(f => f.verifiedPerson).length}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Camera details with verification stats */}
      {!isLiveView && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-muted-foreground flex justify-between items-center">
            <span>{cameraName}</span>
            {eyes.length > 0 && (
              <div className="flex gap-2">
                <span className="text-primary font-medium">
                  {eyes.length} detected
                </span>
                {eyes.filter(f => f.verifiedPerson).length > 0 && (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {eyes.filter(f => f.verifiedPerson).length} verified
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Show recent verifications */}
          {eyes.filter(f => f.verifiedPerson).slice(0, 2).map(eyes => (
            <div key={eyes.id} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              ✓ {eyes.verifiedPerson?.name} ({eyes.verifiedPerson?.role})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CCTVFeed;