export interface CCTVCamera {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline";
  folderId: string;
}

export interface CCTVFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_FOLDER: CCTVFolder = {
  id: "default",
  name: "Uncategorized",
  color: "gray",
  icon: "Settings"
};