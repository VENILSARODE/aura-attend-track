import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Settings, Wifi, WifiOff, Trash2, MoreVertical, Search, ChevronLeft, ChevronRight, Play, Pause, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import CCTVFeed from "@/components/CCTVFeed";

interface CCTVCamera {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline";
}

const CCTV = () => {
  const { toast } = useToast();
  const CAMERAS_PER_PAGE = 12;
  const MAX_CAMERAS = 100;
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  
  const [newCamera, setNewCamera] = useState({
    name: "",
    ipAddress: "",
    port: 8080
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // IP address validation
  const validateIP = (ip: string) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Check if IP already exists
  const isIPDuplicate = (ip: string, port: number) => {
    return cameras.some(camera => camera.ipAddress === ip && camera.port === port);
  };

  // Filtered cameras based on search
  const filteredCameras = useMemo(() => {
    return cameras.filter(camera => 
      camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.ipAddress.includes(searchQuery)
    );
  }, [cameras, searchQuery]);

  // Paginated cameras
  const paginatedCameras = useMemo(() => {
    const startIndex = (currentPage - 1) * CAMERAS_PER_PAGE;
    return filteredCameras.slice(startIndex, startIndex + CAMERAS_PER_PAGE);
  }, [filteredCameras, currentPage]);

  const totalPages = Math.ceil(filteredCameras.length / CAMERAS_PER_PAGE);

  const handleAddCamera = () => {
    // Validate required fields
    if (!newCamera.name.trim() || !newCamera.ipAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate IP address format
    if (!validateIP(newCamera.ipAddress)) {
      toast({
        title: "Invalid IP Address", 
        description: "Please enter a valid IP address (e.g., 192.168.1.100)",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate IP and port
    if (isIPDuplicate(newCamera.ipAddress, newCamera.port)) {
      toast({
        title: "Duplicate Camera",
        description: "A camera with this IP address and port already exists",
        variant: "destructive"
      });
      return;
    }

    // Check camera limit
    if (cameras.length >= MAX_CAMERAS) {
      toast({
        title: "Camera Limit Reached",
        description: `Maximum of ${MAX_CAMERAS} cameras allowed`,
        variant: "destructive"
      });
      return;
    }

    const camera: CCTVCamera = {
      id: Date.now().toString(),
      name: newCamera.name.trim(),
      ipAddress: newCamera.ipAddress.trim(),
      port: newCamera.port,
      status: "offline"
    };
    setCameras([...cameras, camera]);
    setNewCamera({ name: "", ipAddress: "", port: 8080 });
    setIsAddDialogOpen(false);
    toast({
      title: "Camera Added",
      description: `${camera.name} has been successfully added`,
    });
  };

  const toggleCameraStatus = (id: string) => {
    setCameras(cameras.map(camera => 
      camera.id === id 
        ? { ...camera, status: camera.status === "online" ? "offline" : "online" }
        : camera
    ));
  };

  const handleDeleteCamera = (id: string) => {
    setCameraToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCamera = () => {
    if (cameraToDelete) {
      setCameras(cameras.filter(camera => camera.id !== cameraToDelete));
      setCameraToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const quickAddCamera = (name: string, ip: string) => {
    // Check camera limit
    if (cameras.length >= MAX_CAMERAS) {
      toast({
        title: "Camera Limit Reached",
        description: `Maximum of ${MAX_CAMERAS} cameras allowed`,
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate IP
    if (isIPDuplicate(ip, 8080)) {
      toast({
        title: "Duplicate Camera",
        description: "A camera with this IP address already exists",
        variant: "destructive"
      });
      return;
    }

    const camera: CCTVCamera = {
      id: Date.now().toString(),
      name: name,
      ipAddress: ip,
      port: 8080,
      status: "offline"
    };
    setCameras([...cameras, camera]);
    toast({
      title: "Camera Added",
      description: `${name} has been successfully added`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CCTV Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your surveillance cameras ({cameras.length}/{MAX_CAMERAS})
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary/90"
              disabled={cameras.length >= MAX_CAMERAS}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Camera
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Camera</DialogTitle>
              <DialogDescription>
                Enter the camera details to add it to your surveillance system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newCamera.name}
                  onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Main Entrance"
                  maxLength={50}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ip" className="text-right">
                  IP Address*
                </Label>
                <Input
                  id="ip"
                  value={newCamera.ipAddress}
                  onChange={(e) => setNewCamera({ ...newCamera, ipAddress: e.target.value })}
                  className="col-span-3"
                  placeholder="192.168.1.100"
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right">
                  Port*
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={newCamera.port}
                  onChange={(e) => setNewCamera({ ...newCamera, port: parseInt(e.target.value) || 8080 })}
                  className="col-span-3"
                  placeholder="8080"
                  min="1"
                  max="65535"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCamera} className="bg-primary hover:bg-primary/90">
                Add Camera
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Quick Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cameras by name or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => quickAddCamera("Classroom B", "192.168.1.103")}
            className="text-xs"
            disabled={cameras.length >= MAX_CAMERAS}
          >
            + Classroom B
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => quickAddCamera("Library", "192.168.1.104")}
            className="text-xs"
            disabled={cameras.length >= MAX_CAMERAS}
          >
            + Library
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => quickAddCamera("Cafeteria", "192.168.1.105")}
            className="text-xs"
            disabled={cameras.length >= MAX_CAMERAS}
          >
            + Cafeteria
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Camera Grid</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          {filteredCameras.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {cameras.length === 0 ? "No Cameras Added" : "No Cameras Found"}
              </h3>
              <p className="text-muted-foreground">
                {cameras.length === 0 ? "Add your first camera to get started" : "Try adjusting your search terms"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedCameras.map((camera) => (
              <Card key={camera.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-card-foreground">{camera.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={camera.status === "online" ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {camera.status === "online" ? (
                          <Wifi className="h-3 w-3" />
                        ) : (
                          <WifiOff className="h-3 w-3" />
                        )}
                        {camera.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteCamera(camera.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Camera
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription>
                    {camera.ipAddress}:{camera.port}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CCTVFeed
                    cameraName={camera.name}
                    ipAddress={camera.ipAddress}
                    port={camera.port}
                    status={camera.status}
                    cameraId={camera.id}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCameraStatus(camera.id)}
                      className="flex-1"
                    >
                      {camera.status === "online" ? "Disconnect" : "Connect"}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredCameras.length} cameras)
                  </span>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCameras.filter(camera => camera.status === "online").slice(0, 9).map((camera) => (
              <Card key={camera.id} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">{camera.name}</CardTitle>
                  <CardDescription>{camera.ipAddress}:{camera.port}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CCTVFeed
                    cameraName={camera.name}
                    ipAddress={camera.ipAddress}
                    port={camera.port}
                    status={camera.status}
                    isLiveView={true}
                    cameraId={camera.id}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredCameras.filter(camera => camera.status === "online").length === 0 && (
            <div className="text-center py-12">
              <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Live Cameras</h3>
              <p className="text-muted-foreground">Connect cameras to view live feeds</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Camera</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this camera? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCamera} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CCTV;