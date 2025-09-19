import { Wifi, WifiOff, MoreVertical, Trash2, Settings, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CCTVCamera, CCTVFolder } from "@/types/cctv";
import CCTVFeed from "@/components/CCTVFeed";

interface CCTVCameraCardProps {
  camera: CCTVCamera;
  folders: CCTVFolder[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToFolder: (cameraId: string, folderId: string) => void;
}

const CCTVCameraCard = ({ camera, folders, onToggleStatus, onDelete, onMoveToFolder }: CCTVCameraCardProps) => {
  return (
    <Card className="bg-card border-border">
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
                <DropdownMenuItem onClick={() => onDelete(camera.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Camera
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map((folder) => (
                  <DropdownMenuItem 
                    key={folder.id}
                    onClick={() => onMoveToFolder(camera.id, folder.id)}
                    disabled={camera.folderId === folder.id}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Move to {folder.name}
                  </DropdownMenuItem>
                ))}
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
            onClick={() => onToggleStatus(camera.id)}
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
  );
};

export default CCTVCameraCard;