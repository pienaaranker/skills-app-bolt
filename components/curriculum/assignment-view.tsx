import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAssignment } from "@/lib/gemini";
import { Clock, X } from "lucide-react";
import { useState } from "react";

interface AssignmentViewProps {
  assignment: GeneratedAssignment;
  moduleTitle: string;
  stepTitle: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function AssignmentView({
  assignment,
  moduleTitle,
  stepTitle,
  onClose,
  onSubmit,
}: AssignmentViewProps) {
  const [solution, setSolution] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  const handleSubmit = () => {
    onSubmit();
    onClose();
  };

  return (
    <Card className="w-full">
      <CardHeader className="relative pb-2">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <Badge variant="outline" className="w-fit mb-2">Assignment</Badge>
        <CardTitle>{assignment.title}</CardTitle>
        <CardDescription>
          For module: {moduleTitle} - {stepTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-muted-foreground">{assignment.description}</p>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Instructions</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              Estimated time: {assignment.estimatedTime}
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-md">{assignment.instructions}</div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="solution">Your Solution</Label>
          <Textarea
            id="solution"
            placeholder="Enter your solution or reflections here..."
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={6}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="complete" 
            checked={isComplete}
            onCheckedChange={(checked) => setIsComplete(checked as boolean)}
          />
          <Label htmlFor="complete" className="cursor-pointer">
            I have completed this assignment
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={!isComplete}
        >
          Submit Assignment
        </Button>
      </CardFooter>
    </Card>
  );
}