
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SemesterTimetable from "@/components/SemesterTimetable";

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const Timetable = () => {
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [timetableImages, setTimetableImages] = useState<Record<number, string | null>>({});
  const { toast } = useToast();

  const handleSelectSemester = (semester: number) => {
    setSelectedSemester(semester);
  };

  const handleImageUpdate = (semester: number, imageData: string | null) => {
    setTimetableImages(prev => ({
      ...prev,
      [semester]: imageData
    }));
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Timetable</h1>
      
      <Card className="bg-slate-800 text-white border-slate-700 mb-6">
        <CardHeader>
          <CardTitle>Select Semester</CardTitle>
          <CardDescription className="text-slate-400">
            Choose a semester to view or upload its timetable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {semesters.map((semester) => (
              <Button
                key={semester}
                onClick={() => handleSelectSemester(semester)}
                variant={selectedSemester === semester ? "default" : "outline"}
                className={`
                  h-16 text-lg font-bold
                  ${selectedSemester === semester 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"}
                `}
              >
                Semester {semester}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSemester && (
        <SemesterTimetable 
          semester={selectedSemester} 
          timetableImage={timetableImages[selectedSemester] || null}
          onImageUpdate={(imageData) => handleImageUpdate(selectedSemester, imageData)}
        />
      )}
    </div>
  );
};

export default Timetable;
