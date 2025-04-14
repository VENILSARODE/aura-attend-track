
// Student type definition
export interface Student {
  id: string;
  name: string;
  usn: string;
  class: string;
  mobile: string;
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
