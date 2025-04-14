
// Student type definition
export interface Student {
  id: string;
  name: string;
  usn: string;
  class: string;
  mobile: string;
  photo?: string; // URL/base64 of student photo
  attendance: {
    [date: string]: 'present' | 'absent';
  };
}

// User type definition
export interface User {
  id: string;
  username: string;
  password: string;
}

// Semester mapping helper type
export type SemesterGroup = {
  title: string;
  students: Student[];
}
