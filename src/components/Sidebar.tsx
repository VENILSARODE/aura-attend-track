
import { useNavigate } from "react-router-dom";
import { Home, Upload, Camera, Database, MessageSquare, Calendar, Monitor, ClipboardCheck, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { label: "Home", icon: Home, path: "/dashboard" },
    { label: "Upload Data", icon: Upload, path: "/upload-data" },
    { label: "Data Store", icon: Database, path: "/data-store" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
    { label: "Timetable", icon: Calendar, path: "/timetable" },
    { label: "CCTV", icon: Monitor, path: "/cctv" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-lg">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold">Attendance Tracker</h2>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-sm rounded-md transition-colors",
                  "hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm rounded-md text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
