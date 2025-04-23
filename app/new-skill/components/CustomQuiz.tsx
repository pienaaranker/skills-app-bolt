"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Define the structure of questions and options expected from the API
interface QuestionOption {
  value: string;
  label: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
}

// Define the structure of the assessment result
interface AssessmentResult {
  level: "beginner" | "intermediate" | "advanced";
  rationale?: string;
  answers?: Record<string, string>; // Include answers for context
}

interface CustomQuizProps {
  skillName: string;
  questions: QuizQuestion[] | null;
  isLoading: boolean;
  error: string | null;
  onComplete: (results: AssessmentResult) => void;
}

export function CustomQuiz({ skillName, questions, isLoading, error, onComplete }: CustomQuizProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAssessing, setIsAssessing] = useState(false);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsAssessing(true);
    try {
      const response = await fetch('/api/quiz/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillName, answers }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assess quiz answers.');
      }

      // Pass the assessment result and the original answers back
      onComplete({ ...result, answers });

    } catch (err: any) {
      console.error("Error submitting assessment:", err);
      toast({
        title: "Assessment Error",
        description: err.message || "Could not submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const allQuestionsAnswered = questions ? Object.keys(answers).length === questions.length : false;

  return (
    <Card className="mt-6 border-dashed border-amber-500">
      <CardHeader>
        <CardTitle>Custom Experience Assessment</CardTitle>
        <CardDescription>
          Answer these questions about <span className="font-semibold">{skillName || "your chosen skill"}</span> to help us tailor your learning path.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error Loading Quiz</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && questions && questions.map((question) => (
          <div key={question.id}>
            <Label className="font-medium mb-3 block">{question.text}</Label>
            <RadioGroup
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              value={answers[question.id]}
              className="space-y-2"
            >
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                  <Label htmlFor={`${question.id}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
        {!isLoading && !error && !questions && (
           <p className="text-muted-foreground text-center">Could not load quiz questions.</p>
        )}
      </CardContent>
      {/* Only show footer if questions are loaded successfully */}
      {!isLoading && !error && questions && (
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered || isAssessing}
            className="w-full"
          >
            {isAssessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAssessing ? "Assessing..." : "Submit Assessment"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 