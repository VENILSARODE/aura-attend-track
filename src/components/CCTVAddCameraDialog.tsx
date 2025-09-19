import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CCTVFolder } from "@/types/cctv";

interface CCTVAddCameraDialogProps {
  folders: CCTVFolder[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCamera: (name: string, ipAddress: string, port: number, folderId: string) => void;
  disabled?: boolean;
}

const CCTVAddCameraDialog = ({ folders, isOpen, onOpenChange, onAddCamera, disabled }: CCTVAddCameraDialogProps) => {
  const [newCamera, setNewCamera] = useState({
    name: "",
    ipAddress: "",
    port: 8080,
    folderId: folders[0]?.id || ""
  });

  const handleSubmit = () => {
    onAddCamera(newCamera.name, newCamera.ipAddress, newCamera.port, newCamera.folderId);
    setNewCamera({ name: "", ipAddress: "", port: 8080, folderId: folders[0]?.id || "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-primary hover:bg-primary/90"
          disabled={disabled}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder" className="text-right">
              Folder
            </Label>
            <Select 
              value={newCamera.folderId} 
              onValueChange={(value) => setNewCamera({ ...newCamera, folderId: value })}
              disabled={folders.length === 0}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={folders.length === 0 ? "No folders available" : "Select folder (optional)"} />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Add Camera
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CCTVAddCameraDialog;