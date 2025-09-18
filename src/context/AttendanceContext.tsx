import { createContext, useContext, useState, ReactNode } from 'react';

interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  role: string;
  timestamp: Date;
  cameraId: string;
  cameraName: string;
  confidence: number;
  verified: boolean;
}

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  markAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  getTodayAttendance: () => AttendanceRecord[];
  getAttendanceByPerson: (personId: string) => AttendanceRecord[];
  clearAttendance: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const markAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
    // Check if person already marked attendance today
    const today = new Date().toDateString();
    const existingRecord = attendanceRecords.find(
      r => r.personId === record.personId && 
           new Date(r.timestamp).toDateString() === today
    );

    if (!existingRecord) {
      const newRecord: AttendanceRecord = {
        ...record,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      
      setAttendanceRecords(prev => [newRecord, ...prev]);
      return newRecord;
    }
    
    return existingRecord;
  };

  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    return attendanceRecords.filter(
      record => new Date(record.timestamp).toDateString() === today
    );
  };

  const getAttendanceByPerson = (personId: string) => {
    return attendanceRecords.filter(record => record.personId === personId);
  };

  const clearAttendance = () => {
    setAttendanceRecords([]);
  };

  return (
    <AttendanceContext.Provider 
      value={{
        attendanceRecords,
        markAttendance,
        getTodayAttendance,
        getAttendanceByPerson,
        clearAttendance
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export type { AttendanceRecord };