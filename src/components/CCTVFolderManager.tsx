import { useState } from "react";
import { Plus, Edit, Trash2, Folder, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CCTVFolder } from "@/types/cctv";

interface CCTVFolderManagerProps {
  folders: CCTVFolder[];
  onAddFolder: (name: string, color: string, icon: string) => void;
  onEditFolder: (id: string, name: string, color: string, icon: string) => void;
  onDeleteFolder: (id: string) => void;
}

const FOLDER_COLORS = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "yellow", label: "Yellow" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
];

const FOLDER_ICONS = [
  { value: "Folder", label: "Folder" },
  { value: "FolderOpen", label: "Open Folder" },
  { value: "Building", label: "Building" },
  { value: "Camera", label: "Camera" },
  { value: "Shield", label: "Shield" },
  { value: "Eye", label: "Eye" },
];

const CCTVFolderManager = ({ folders, onAddFolder, onEditFolder, onDeleteFolder }: CCTVFolderManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CCTVFolder | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  
  const [newFolder, setNewFolder] = useState({
    name: "",
    color: "blue",
    icon: "Folder"
  });

  const handleAddFolder = () => {
    if (newFolder.name.trim()) {
      onAddFolder(newFolder.name.trim(), newFolder.color, newFolder.icon);
      setNewFolder({ name: "", color: "blue", icon: "Folder" });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditFolder = () => {
    if (editingFolder && newFolder.name.trim()) {
      onEditFolder(editingFolder.id, newFolder.name.trim(), newFolder.color, newFolder.icon);
      setEditingFolder(null);
      setNewFolder({ name: "", color: "blue", icon: "Folder" });
    }
  };

  const openEditDialog = (folder: CCTVFolder) => {
    setEditingFolder(folder);
    setNewFolder({
      name: folder.name,
      color: folder.color,
      icon: folder.icon
    });
  };

  const handleDeleteFolder = (id: string) => {
    setFolderToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      onDeleteFolder(folderToDelete);
      setFolderToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Folders</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your cameras.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="folder-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="folder-name"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Ground Floor"
                  maxLength={30}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="folder-color" className="text-right">
                  Color
                </Label>
                <Select value={newFolder.color} onValueChange={(value) => setNewFolder({ ...newFolder, color: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDER_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="folder-icon" className="text-right">
                  Icon
                </Label>
                <Select value={newFolder.icon} onValueChange={(value) => setNewFolder({ ...newFolder, icon: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDER_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFolder}>
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {folders.map((folder) => (
          <div key={folder.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <Folder className={`h-4 w-4 text-${folder.color}-500`} />
              <span className="font-medium">{folder.name}</span>
            </div>
            <div className="flex gap-1">
              <Dialog open={editingFolder?.id === folder.id} onOpenChange={(open) => !open && setEditingFolder(null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(folder)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Folder</DialogTitle>
                    <DialogDescription>
                      Edit the folder details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-folder-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="edit-folder-name"
                        value={newFolder.name}
                        onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Ground Floor"
                        maxLength={30}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-folder-color" className="text-right">
                        Color
                      </Label>
                      <Select value={newFolder.color} onValueChange={(value) => setNewFolder({ ...newFolder, color: value })}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {FOLDER_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-folder-icon" className="text-right">
                        Icon
                      </Label>
                      <Select value={newFolder.icon} onValueChange={(value) => setNewFolder({ ...newFolder, icon: value })}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {FOLDER_ICONS.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingFolder(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditFolder}>
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteFolder(folder.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? Cameras in this folder will be moved to "Uncategorized".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CCTVFolderManager;