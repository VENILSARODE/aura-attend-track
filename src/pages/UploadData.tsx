
import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, AlertCircle, CheckCircle2, Camera, Upload, X, FileImage } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

const UploadData = () => {
  const { addStudent } = useData();
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [className, setClassName] = useState("");
  const [mobile, setMobile] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate form
    if (!name || !usn || !className || !mobile) {
      setError("Please fill all the fields");
      return;
    }

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError("Please enter a valid 10 digit mobile number");
      return;
    }

    if (!photo) {
      setError("Please upload or take a photo");
      return;
    }

    // Add student
    addStudent({
      name,
      usn,
      class: className,
      mobile,
      photo
    });

    // Reset form
    setName("");
    setUsn("");
    setClassName("");
    setMobile("");
    setPhoto(null);
    setSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Take photo
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const photoData = canvas.toDataURL('image/jpeg');
        setPhoto(photoData);
        
        // Stop camera
        stopCamera();
      }
    }
  };

  // Clear photo
  const clearPhoto = () => {
    setPhoto(null);
  };

  // Directly trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Student Data</h1>
        <p className="text-muted-foreground">
          Add a new student to the database
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-md max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <span>Add Student</span>
          </CardTitle>
          <CardDescription>
            Enter student details to register in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-900/20 p-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-900/20 p-3 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Student added successfully!</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter student's full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usn">USN</Label>
              <Input
                id="usn"
                placeholder="Enter student's USN"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Input
                id="class"
                placeholder="Enter student's class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="Enter student's mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="block mb-2">Photo</Label>
              
              {photo ? (
                <div className="flex items-center justify-between gap-4 p-2 border border-slate-600 rounded-md bg-slate-700">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-slate-500">
                      <AvatarImage src={photo} alt={name || "Student"} />
                      <AvatarFallback className="bg-slate-600">{name ? name.charAt(0) : "S"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-300">Photo uploaded</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearPhoto}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600">
                        <Camera className="mr-2 h-4 w-4" />
                        Take Selfie
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-4 bg-slate-800 rounded-t-md">
                        <h3 className="font-medium">Take a Photo</h3>
                        <p className="text-sm text-slate-400 mt-1">Please ensure you have good lighting</p>
                      </div>
                      
                      <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
                        {cameraActive ? (
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                            <Camera className="h-8 w-8 mb-2 text-slate-400" />
                            <p className="text-sm text-slate-400">Camera preview will appear here</p>
                          </div>
                        )}
                        
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      
                      <div className="flex p-3 bg-slate-800 rounded-b-md gap-2">
                        {cameraActive ? (
                          <>
                            <Button type="button" variant="secondary" className="flex-1" onClick={stopCamera}>
                              Cancel
                            </Button>
                            <Button type="button" className="flex-1" onClick={takePhoto}>
                              Capture
                            </Button>
                          </>
                        ) : (
                          <Button type="button" className="w-full" onClick={startCamera}>
                            Start Camera
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Hidden file input with ref */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    capture={isMobile ? "environment" : undefined}
                  />
                  
                  {/* Button that directly triggers file input */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600"
                    onClick={triggerFileUpload}
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    From Gallery
                  </Button>
                </div>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              Add Student
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadData;
