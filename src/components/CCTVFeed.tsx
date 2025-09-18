import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Users, Maximize2, WifiOff } from "lucide-react";

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
}

const CCTVFeed: React.FC<CCTVFeedProps> = ({ 
  cameraName, 
  ipAddress, 
  port, 
  status, 
  isLiveView = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(status === "online");
  const [faces, setFaces] = useState<Face[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  
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
      
      // Generate simulated faces
      const simulatedFaces: Face[] = [
        {
          id: 1,
          x: 120 + Math.sin(time) * 30,
          y: 80 + Math.cos(time * 0.5) * 20,
          width: 60,
          height: 80,
          confidence: 0.85 + Math.sin(time) * 0.1,
          name: "John Doe"
        },
        {
          id: 2,
          x: 200 + Math.cos(time * 0.7) * 40,
          y: 120 + Math.sin(time * 0.3) * 25,
          width: 55,
          height: 75,
          confidence: 0.78 + Math.cos(time) * 0.1,
          name: "Jane Smith"
        }
      ];

      setFaces(simulatedFaces);

      // Draw face detection rectangles
      simulatedFaces.forEach((face) => {
        // Face bounding box
        ctx.strokeStyle = face.confidence > 0.8 ? '#00ff00' : '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(face.x, face.y, face.width, face.height);

        // Face label background
        const labelText = `${face.name || 'Unknown'} (${Math.round(face.confidence * 100)}%)`;
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(face.x, face.y - 25, textWidth + 10, 20);

        // Face label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, face.x + 5, face.y - 10);
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

        {/* Face count */}
        {faces.length > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              <Users className="h-3 w-3 mr-1" />
              {faces.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Camera details */}
      {!isLiveView && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>{cameraName}</span>
            {faces.length > 0 && (
              <span className="text-primary font-medium">
                {faces.length} face{faces.length > 1 ? 's' : ''} detected
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CCTVFeed;