
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

const UploadData = () => {
  const { addStudent } = useData();
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [className, setClassName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate form
    if (!name || !usn || !className || !mobile) {
      setError("Please fill all the fields");
      return;
    }

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError("Please enter a valid 10 digit mobile number");
      return;
    }

    // Add student
    addStudent({
      name,
      usn,
      class: className,
      mobile
    });

    // Reset form
    setName("");
    setUsn("");
    setClassName("");
    setMobile("");
    setSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Student Data</h1>
        <p className="text-muted-foreground">
          Add a new student to the database
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-md max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <span>Add Student</span>
          </CardTitle>
          <CardDescription>
            Enter student details to register in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-900/20 p-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-900/20 p-3 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Student added successfully!</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter student's full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usn">USN</Label>
              <Input
                id="usn"
                placeholder="Enter student's USN"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Input
                id="class"
                placeholder="Enter student's class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="Enter student's mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            
            <Button type="submit" className="w-full">
              Add Student
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadData;
