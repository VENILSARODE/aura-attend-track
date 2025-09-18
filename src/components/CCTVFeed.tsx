import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Users, Maximize2, WifiOff, Check, X, UserCheck } from "lucide-react";
import { faceVerificationService, DetectedFace, StoredPerson } from "@/utils/faceVerification";
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
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize face verification service
  useEffect(() => {
    const initService = async () => {
      try {
        await faceVerificationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize face verification:', error);
      }
    };
    
    if (status === "online") {
      initService();
    }
  }, [status]);

  // Convert stored data to person format for face verification
  const storedPersons: StoredPerson[] = students.map(student => ({
    id: student.id.toString(),
    name: student.name,
    role: 'Student', // Default role for all students
    faceEmbedding: undefined // Will be generated on first use
  }));
  
  // Simulate camera feed and face detection
  useEffect(() => {
    if (status === "offline" || !isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawFrame = () => {
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
      
      // Generate detected faces
      const detectedFaces = faceVerificationService.detectFacesInFrame(frameCount, cameraId);
      
      // Verify faces against stored data
      const verifiedFaces = faceVerificationService.verifyFaces(detectedFaces, storedPersons);
      
      setFaces(verifiedFaces);

      // Draw face detection rectangles and verification results
      verifiedFaces.forEach((face) => {
        const isVerified = !!face.verifiedPerson;
        
        // Face bounding box - green for verified, yellow for unverified, red for low confidence
        if (isVerified) {
          ctx.strokeStyle = '#00ff00'; // Green for verified
        } else if (face.confidence > 0.7) {
          ctx.strokeStyle = '#ffaa00'; // Orange for unverified but confident detection
        } else {
          ctx.strokeStyle = '#ff0000'; // Red for low confidence
        }
        
        ctx.lineWidth = 2;
        ctx.strokeRect(face.x, face.y, face.width, face.height);

        // Verification indicator
        if (isVerified) {
          // Green checkmark for verified
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(face.x + face.width - 20, face.y, 20, 20);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(face.x + face.width - 16, face.y + 8);
          ctx.lineTo(face.x + face.width - 12, face.y + 12);
          ctx.lineTo(face.x + face.width - 6, face.y + 4);
          ctx.stroke();
        } else {
          // Red X for unverified
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(face.x + face.width - 20, face.y, 20, 20);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(face.x + face.width - 16, face.y + 4);
          ctx.lineTo(face.x + face.width - 6, face.y + 14);
          ctx.moveTo(face.x + face.width - 6, face.y + 4);
          ctx.lineTo(face.x + face.width - 16, face.y + 14);
          ctx.stroke();
        }

        // Face label background
        const labelText = face.verifiedPerson 
          ? `${face.verifiedPerson.name} (${Math.round(face.verifiedPerson.confidence * 100)}%)`
          : `Unknown (${Math.round(face.confidence * 100)}%)`;
        
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillStyle = isVerified ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(face.x, face.y - 25, textWidth + 10, 20);

        // Face label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, face.x + 5, face.y - 10);

        // Mark attendance for verified faces
        if (isVerified && face.verifiedPerson && frameCount % 300 === 0) { // Every 10 seconds
          markAttendance({
            personId: face.verifiedPerson.id,
            personName: face.verifiedPerson.name,
            role: face.verifiedPerson.role,
            timestamp: new Date(),
            cameraId: cameraId,
            cameraName: cameraName,
            confidence: face.verifiedPerson.confidence,
            verified: true
          });
          
          toast({
            title: "Attendance Marked",
            description: `${face.verifiedPerson.name} attendance recorded from ${cameraName}`,
          });
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

        {/* Face count with verification status */}
        {faces.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="secondary" className="bg-black/50 text-white">
              <Users className="h-3 w-3 mr-1" />
              {faces.length}
            </Badge>
            {faces.filter(f => f.verifiedPerson).length > 0 && (
              <Badge variant="default" className="bg-green-600/80 text-white">
                <UserCheck className="h-3 w-3 mr-1" />
                {faces.filter(f => f.verifiedPerson).length}
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
            {faces.length > 0 && (
              <div className="flex gap-2">
                <span className="text-primary font-medium">
                  {faces.length} detected
                </span>
                {faces.filter(f => f.verifiedPerson).length > 0 && (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {faces.filter(f => f.verifiedPerson).length} verified
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Show recent verifications */}
          {faces.filter(f => f.verifiedPerson).slice(0, 2).map(face => (
            <div key={face.id} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              ✓ {face.verifiedPerson?.name} ({face.verifiedPerson?.role})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CCTVFeed;