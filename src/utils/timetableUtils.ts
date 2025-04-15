
import { useState, useEffect } from "react";

// Time periods for classes (24-hour format)
const timePeriods = [
  { period: 1, start: "09:00", end: "09:50" },
  { period: 2, start: "09:50", end: "10:40" },
  { period: 3, start: "10:40", end: "11:30" },
  { period: 4, start: "11:30", end: "12:20" },
  { period: 5, start: "13:20", end: "14:10" },
  { period: 6, start: "14:10", end: "15:00" },
  { period: 7, start: "15:00", end: "15:50" },
  { period: 8, start: "15:50", end: "16:40" }
];

/**
 * Determines the current period based on the current time
 * @returns The current period number or null if outside class hours
 */
export const getCurrentPeriod = (): number | null => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  
  for (const { period, start, end } of timePeriods) {
    if (currentTime >= start && currentTime < end) {
      return period;
    }
  }
  
  return null; // Outside of class hours
};

/**
 * Custom hook to get current period and auto-update when period changes
 */
export const useCurrentPeriod = () => {
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(getCurrentPeriod());
  
  useEffect(() => {
    // Update period immediately
    setCurrentPeriod(getCurrentPeriod());
    
    // Set up interval to check period every minute
    const intervalId = setInterval(() => {
      setCurrentPeriod(getCurrentPeriod());
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  return currentPeriod;
};

/**
 * Gets the subject name from the timetable image and period
 * @param timetableImage Base64 string of the timetable image
 * @param period Current period number
 * @returns Subject name (for now returns a generic subject based on period)
 */
export const getSubjectForPeriod = (timetableImage: string | null, period: number | null): string => {
  // In a real implementation, we would need OCR to extract subject info from the timetable image
  // For now, we'll return placeholder subjects based on period
  if (!period) return "Unknown";
  
  const subjectMap: Record<number, string> = {
    1: "Mathematics",
    2: "Physics",
    3: "Chemistry",
    4: "Biology",
    5: "Computer Science",
    6: "English",
    7: "History",
    8: "Geography"
  };
  
  return subjectMap[period] || "Unknown";
};

/**
 * Extract semester number from class string
 * @param classStr The class string (e.g. "3rd Semester CSE" or "2nd Year ECE")
 * @returns Semester number (1-8)
 */
export const getSemesterFromClass = (classStr: string): number => {
  // Try to extract numbers from the class string
  const semMatch = classStr.match(/(\d+)(st|nd|rd|th)?(\s+)?(sem|semester)?/i);
  if (semMatch) {
    return parseInt(semMatch[1], 10);
  }
  
  // Check for year-based format
  const yearMatch = classStr.match(/(1st|2nd|3rd|4th)(\s+)?year/i);
  if (yearMatch) {
    // Convert year to semester (approximately)
    switch(yearMatch[1].toLowerCase()) {
      case '1st': return 2; // 1st year ~ 2nd semester
      case '2nd': return 4; // 2nd year ~ 4th semester
      case '3rd': return 6; // 3rd year ~ 6th semester
      case '4th': return 8; // 4th year ~ 8th semester
      default: return 1;
    }
  }
  
  return 1; // Default to 1st semester if no match
};
