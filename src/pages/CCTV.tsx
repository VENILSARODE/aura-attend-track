import { useState, useMemo } from "react";
import { Settings, WifiOff, Search, ChevronLeft, ChevronRight, Users, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CCTVCamera, CCTVFolder, DEFAULT_FOLDER } from "@/types/cctv";
import CCTVCameraCard from "@/components/CCTVCameraCard";
import CCTVAddCameraDialog from "@/components/CCTVAddCameraDialog";
import CCTVFolderManager from "@/components/CCTVFolderManager";
import CCTVFeed from "@/components/CCTVFeed";

const CCTV = () => {
  const { toast } = useToast();
  const CAMERAS_PER_PAGE = 12;
  const MAX_CAMERAS = 100;
  
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [folders, setFolders] = useState<CCTVFolder[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(["default"]));

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

  // Group cameras by folder
  const camerasByFolder = useMemo(() => {
    const allFolders = [DEFAULT_FOLDER, ...folders];
    const grouped: Record<string, { folder: CCTVFolder; cameras: CCTVCamera[] }> = {};
    
    allFolders.forEach(folder => {
      grouped[folder.id] = {
        folder,
        cameras: filteredCameras.filter(camera => camera.folderId === folder.id)
      };
    });
    
    return grouped;
  }, [filteredCameras, folders]);

  // Paginated cameras for flat view
  const paginatedCameras = useMemo(() => {
    const startIndex = (currentPage - 1) * CAMERAS_PER_PAGE;
    return filteredCameras.slice(startIndex, startIndex + CAMERAS_PER_PAGE);
  }, [filteredCameras, currentPage]);

  const totalPages = Math.ceil(filteredCameras.length / CAMERAS_PER_PAGE);

  const handleAddCamera = (name: string, ipAddress: string, port: number, folderId: string) => {
    // Validate required fields
    if (!name.trim() || !ipAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate IP address format
    if (!validateIP(ipAddress)) {
      toast({
        title: "Invalid IP Address", 
        description: "Please enter a valid IP address (e.g., 192.168.1.100)",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate IP and port
    if (isIPDuplicate(ipAddress, port)) {
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
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      port: port,
      status: "offline",
      folderId: folderId
    };
    setCameras([...cameras, camera]);
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

  const moveToFolder = (cameraId: string, folderId: string) => {
    setCameras(cameras.map(camera => 
      camera.id === cameraId 
        ? { ...camera, folderId: folderId }
        : camera
    ));
    toast({
      title: "Camera Moved",
      description: "Camera has been moved to the selected folder",
    });
  };

  const quickAddCamera = (name: string, ip: string, folderId: string = DEFAULT_FOLDER.id) => {
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
      status: "offline",
      folderId: folderId
    };
    setCameras([...cameras, camera]);
    toast({
      title: "Camera Added",
      description: `${name} has been successfully added`,
    });
  };

  const handleAddFolder = (name: string, color: string, icon: string) => {
    const folder: CCTVFolder = {
      id: Date.now().toString(),
      name: name,
      color: color,
      icon: icon
    };
    setFolders([...folders, folder]);
    toast({
      title: "Folder Created",
      description: `${name} folder has been created`,
    });
  };

  const handleEditFolder = (id: string, name: string, color: string, icon: string) => {
    setFolders(folders.map(folder => 
      folder.id === id 
        ? { ...folder, name, color, icon }
        : folder
    ));
    toast({
      title: "Folder Updated",
      description: `Folder has been updated`,
    });
  };

  const handleDeleteFolder = (id: string) => {
    // Move all cameras from this folder to default
    setCameras(cameras.map(camera => 
      camera.folderId === id 
        ? { ...camera, folderId: DEFAULT_FOLDER.id }
        : camera
    ));
    setFolders(folders.filter(folder => folder.id !== id));
    toast({
      title: "Folder Deleted",
      description: "Folder deleted and cameras moved to Uncategorized",
    });
  };

  const toggleFolder = (folderId: string) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(folderId)) {
      newOpenFolders.delete(folderId);
    } else {
      newOpenFolders.add(folderId);
    }
    setOpenFolders(newOpenFolders);
  };

  const allFolders = [DEFAULT_FOLDER, ...folders];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CCTV Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your surveillance cameras ({cameras.length}/{MAX_CAMERAS})
          </p>
        </div>
        
        <div className="flex gap-2">
          <CCTVAddCameraDialog
            folders={folders}
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAddCamera={handleAddCamera}
            disabled={cameras.length >= MAX_CAMERAS}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                disabled={cameras.length >= MAX_CAMERAS}
              >
                Quick Add
                <Settings className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => quickAddCamera("Main Entrance", "192.168.1.101")}>
                <Settings className="h-4 w-4 mr-2" />
                Main Entrance (192.168.1.101)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickAddCamera("Classroom A", "192.168.1.102")}>
                <Users className="h-4 w-4 mr-2" />
                Classroom A (192.168.1.102)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickAddCamera("Classroom B", "192.168.1.103")}>
                <Users className="h-4 w-4 mr-2" />
                Classroom B (192.168.1.103)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickAddCamera("Library", "192.168.1.104")}>
                <Settings className="h-4 w-4 mr-2" />
                Library (192.168.1.104)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickAddCamera("Cafeteria", "192.168.1.105")}>
                <Settings className="h-4 w-4 mr-2" />
                Cafeteria (192.168.1.105)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickAddCamera("Parking Lot", "192.168.1.106")}>
                <Settings className="h-4 w-4 mr-2" />
                Parking Lot (192.168.1.106)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
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
      </div>

      <Tabs defaultValue="folders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="grid">All Cameras</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="folders" className="space-y-6">
          <CCTVFolderManager
            folders={folders}
            onAddFolder={handleAddFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
          />
          
          <div className="space-y-4">
            {Object.values(camerasByFolder).map(({ folder, cameras: folderCameras }) => (
              <Collapsible
                key={folder.id}
                open={openFolders.has(folder.id)}
                onOpenChange={() => toggleFolder(folder.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-2">
                      {openFolders.has(folder.id) ? (
                        <FolderOpen className="h-5 w-5" />
                      ) : (
                        <Folder className="h-5 w-5" />
                      )}
                      <span className="font-medium">{folder.name}</span>
                      <span className="text-sm text-muted-foreground">({folderCameras.length})</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {folderCameras.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No cameras in this folder
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {folderCameras.map((camera) => (
                        <CCTVCameraCard
                          key={camera.id}
                          camera={camera}
                          folders={allFolders}
                          onToggleStatus={toggleCameraStatus}
                          onDelete={handleDeleteCamera}
                          onMoveToFolder={moveToFolder}
                        />
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </TabsContent>
        
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
                  <CCTVCameraCard
                    key={camera.id}
                    camera={camera}
                    folders={allFolders}
                    onToggleStatus={toggleCameraStatus}
                    onDelete={handleDeleteCamera}
                    onMoveToFolder={moveToFolder}
                  />
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