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