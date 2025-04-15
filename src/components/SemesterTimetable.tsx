
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SemesterTimetableProps {
  semester: number;
}

const SemesterTimetable = ({ semester }: SemesterTimetableProps) => {
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setTimetableImage(e.target.result as string);
        toast({
          title: "Image uploaded",
          description: `Timetable image for Semester ${semester} has been uploaded`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="bg-slate-800 text-white border-slate-700">
      <CardHeader>
        <CardTitle>Semester {semester} Timetable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Button
            onClick={handleSelectImage}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <ImagePlus className="h-5 w-5" />
            Add Image from Gallery
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {timetableImage ? (
          <div className="mt-4 flex justify-center">
            <div className="rounded-md overflow-hidden border border-slate-600 max-w-full">
              <img 
                src={timetableImage} 
                alt={`Semester ${semester} Timetable`} 
                className="max-w-full h-auto"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-48 bg-slate-700 rounded-md border border-dashed border-slate-600">
            <p className="text-slate-400">No timetable image uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SemesterTimetable;
