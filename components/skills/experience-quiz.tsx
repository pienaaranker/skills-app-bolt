"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface ExperienceQuizProps {
  skill: string;
  onComplete: (results: any) => void;
}

export function ExperienceQuiz({ skill, onComplete }: ExperienceQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Generate dynamic questions based on the skill
  const questions = [
    {
      id: "familiarity",
      type: "radio",
      question: `How familiar are you with ${skill}?`,
      options: [
        { value: "never", label: "I've never used it before" },
        { value: "basics", label: "I understand the basics" },
        { value: "working", label: "I have working knowledge" },
        { value: "advanced", label: "I have advanced knowledge" },
      ],
    },
    {
      id: "projects",
      type: "radio",
      question: `Have you completed any projects using ${skill}?`,
      options: [
        { value: "none", label: "None" },
        { value: "simple", label: "Simple practice projects" },
        { value: "moderate", label: "Moderate complexity projects" },
        { value: "complex", label: "Complex real-world projects" },
      ],
    },
    {
      id: "experience_years",
      type: "radio",
      question: `How long have you been learning or using ${skill}?`,
      options: [
        { value: "new", label: "I'm just starting" },
        { value: "months", label: "A few months" },
        { value: "year", label: "About a year" },
        { value: "years", label: "Several years" },
      ],
    },
    {
      id: "specific_concepts",
      type: "text",
      question: `What specific concepts or topics in ${skill} are you already familiar with?`,
      placeholder: "List concepts you're familiar with, separated by commas",
    },
    {
      id: "learning_goals",
      type: "textarea",
      question: `What are your main goals for learning ${skill}?`,
      placeholder: "Describe what you hope to achieve",
    },
  ];

  const handleAnswer = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate experience level based on answers
      const experienceResult = analyzeExperience(answers);
      onComplete(experienceResult);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const analyzeExperience = (answers: Record<string, any>) => {
    // In a real implementation, this would be more sophisticated
    // For now, we'll use a simple scoring system
    let points = 0;
    
    if (answers.familiarity === "never") points += 0;
    else if (answers.familiarity === "basics") points += 1;
    else if (answers.familiarity === "working") points += 2;
    else if (answers.familiarity === "advanced") points += 3;
    
    if (answers.projects === "none") points += 0;
    else if (answers.projects === "simple") points += 1;
    else if (answers.projects === "moderate") points += 2;
    else if (answers.projects === "complex") points += 3;
    
    if (answers.experience_years === "new") points += 0;
    else if (answers.experience_years === "months") points += 1;
    else if (answers.experience_years === "year") points += 2;
    else if (answers.experience_years === "years") points += 3;
    
    let level = "beginner";
    if (points >= 7) level = "advanced";
    else if (points >= 3) level = "intermediate";
    
    return {
      level,
      answers,
      points,
    };
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{currentQ.question}</h3>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          <div className="space-y-4">
            {currentQ.type === "radio" && (
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                <div className="space-y-2">
                  {currentQ.options?.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAnswer(currentQ.id, option.value)}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`${currentQ.id}-${option.value}`}
                      />
                      <Label
                        htmlFor={`${currentQ.id}-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQ.type === "text" && (
              <div className="space-y-2">
                <Input
                  id={currentQ.id}
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder}
                />
              </div>
            )}

            {currentQ.type === "textarea" && (
              <div className="space-y-2">
                <Textarea
                  id={currentQ.id}
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder}
                  rows={4}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestion === 0}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
            >
              {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}