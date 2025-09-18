import { useState } from "react";
import { Plus, Settings, Wifi, WifiOff, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CCTVCamera {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline";
}

const CCTV = () => {
  const [cameras, setCameras] = useState<CCTVCamera[]>([
    {
      id: "1",
      name: "Main Entrance",
      ipAddress: "192.168.1.101",
      port: 8080,
      status: "online"
    },
    {
      id: "2", 
      name: "Classroom A",
      ipAddress: "192.168.1.102",
      port: 8080,
      status: "offline"
    }
  ]);
  
  const [newCamera, setNewCamera] = useState({
    name: "",
    ipAddress: "",
    port: 8080
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<string | null>(null);

  const handleAddCamera = () => {
    if (newCamera.name && newCamera.ipAddress) {
      const camera: CCTVCamera = {
        id: Date.now().toString(),
        name: newCamera.name,
        ipAddress: newCamera.ipAddress,
        port: newCamera.port,
        status: "offline"
      };
      setCameras([...cameras, camera]);
      setNewCamera({ name: "", ipAddress: "", port: 8080 });
      setIsAddDialogOpen(false);
    }
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
    const camera: CCTVCamera = {
      id: Date.now().toString(),
      name: name,
      ipAddress: ip,
      port: 8080,
      status: "offline"
    };
    setCameras([...cameras, camera]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CCTV Management</h1>
          <p className="text-muted-foreground">Monitor and manage your surveillance cameras</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
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
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ip" className="text-right">
                  IP Address
                </Label>
                <Input
                  id="ip"
                  value={newCamera.ipAddress}
                  onChange={(e) => setNewCamera({ ...newCamera, ipAddress: e.target.value })}
                  className="col-span-3"
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right">
                  Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={newCamera.port}
                  onChange={(e) => setNewCamera({ ...newCamera, port: parseInt(e.target.value) || 8080 })}
                  className="col-span-3"
                  placeholder="8080"
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

      {/* Quick Add Options */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => quickAddCamera("Classroom B", "192.168.1.103")}
          className="text-xs"
        >
          + Quick Add: Classroom B
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => quickAddCamera("Library", "192.168.1.104")}
          className="text-xs"
        >
          + Quick Add: Library
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => quickAddCamera("Cafeteria", "192.168.1.105")}
          className="text-xs"
        >
          + Quick Add: Cafeteria
        </Button>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Camera Grid</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map((camera) => (
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
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {camera.status === "online" ? (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                          <Settings className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Camera Feed</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <WifiOff className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                        <p className="text-sm text-muted-foreground">Camera Offline</p>
                      </div>
                    )}
                  </div>
                  
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
        </TabsContent>
        
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cameras.filter(camera => camera.status === "online").map((camera) => (
              <Card key={camera.id} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">{camera.name}</CardTitle>
                  <CardDescription>{camera.ipAddress}:{camera.port}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                        <Settings className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground">Live Feed - {camera.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {cameras.filter(camera => camera.status === "online").length === 0 && (
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