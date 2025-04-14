
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Student } from "../types";

type DataContextType = {
  students: Student[];
  addStudent: (student: Omit<Student, "id" | "attendance">) => void;
  getStudent: (id: string) => Student | undefined;
  updateAttendance: (id: string, date: string, status: 'present' | 'absent') => void;
  processAttendance: (recognizedFaces: string[]) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const STUDENTS_STORAGE_KEY = "attendanceTracker_students";

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    // Load students from local storage
    const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
  }, []);

  // Save students to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const addStudent = (studentData: Omit<Student, "id" | "attendance">) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
      attendance: {}
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const getStudent = (id: string) => {
    return students.find(student => student.id === id);
  };

  const updateAttendance = (id: string, date: string, status: 'present' | 'absent') => {
    console.log(`Marking student ${id} as ${status} on ${date}`);
    
    setStudents(prev => 
      prev.map(student => 
        student.id === id 
          ? { 
              ...student, 
              attendance: { 
                ...student.attendance, 
                [date]: status 
              } 
            } 
          : student
      )
    );
  };

  // Simulate facial recognition processing
  const processAttendance = (recognizedFaces: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Processing attendance for ${recognizedFaces.length} recognized faces on ${today}`);
    
    setStudents(prev => 
      prev.map(student => {
        const isPresent = recognizedFaces.includes(student.usn);
        console.log(`Student ${student.name} (${student.usn}): ${isPresent ? 'present' : 'absent'}`);
        
        return {
          ...student,
          attendance: {
            ...student.attendance,
            [today]: isPresent ? 'present' : 'absent'
          }
        };
      })
    );
  };

  return (
    <DataContext.Provider
      value={{ 
        students, 
        addStudent, 
        getStudent,
        updateAttendance,
        processAttendance
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
