"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ExternalLink, ListChecks, DivideIcon as LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GeneratedCurriculum } from "@/lib/gemini";
import { Skill } from "@/types/supabase";

interface CurriculumViewProps {
  skill: Skill;
  curriculum: GeneratedCurriculum;
  onComplete: (moduleIndex: number, stepIndex: number) => void;
  onRequestAssignment: (moduleIndex: number, stepIndex: number) => void;
}

export function CurriculumView({
  skill,
  curriculum,
  onComplete,
  onRequestAssignment,
}: CurriculumViewProps) {
  const [activeModule, setActiveModule] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Calculate progress
  const totalSteps = curriculum.modules.reduce(
    (acc, module) => acc + module.steps.length,
    0
  );
  
  const completedSteps = curriculum.modules.reduce(
    (acc, module) => acc + module.steps.filter(step => step.completed).length,
    0
  );
  
  const progress = Math.round((completedSteps / totalSteps) * 100);

  const handleMarkComplete = () => {
    onComplete(activeModule, activeStep);
  };

  const handleGetAssignment = () => {
    onRequestAssignment(activeModule, activeStep);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{curriculum.title}</h1>
          <p className="text-muted-foreground mt-1">
            {curriculum.description}
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {skill.experience_level}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {completedSteps} of {totalSteps} steps completed
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="px-5 pb-0">
            <CardTitle className="text-lg">Learning Modules</CardTitle>
            <CardDescription>Select a module to begin</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-1 p-5 pt-0">
                {curriculum.modules.map((module, moduleIndex) => (
                  <Button
                    key={moduleIndex}
                    variant={activeModule === moduleIndex ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setActiveModule(moduleIndex);
                      setActiveStep(0);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs">
                        {moduleIndex + 1}
                      </span>
                      <div className="flex-1">
                        <div className="line-clamp-1 font-medium">{module.title}</div>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {module.steps.filter(step => step.completed).length} of {module.steps.length} steps completed
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <Tabs defaultValue="learn" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="learn">
                <BookOpen className="mr-2 h-4 w-4" />
                Learn
              </TabsTrigger>
              <TabsTrigger value="steps">
                <ListChecks className="mr-2 h-4 w-4" />
                Steps
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="learn" className="border-none p-0">
              <CardContent className="p-6">
                {curriculum.modules[activeModule]?.steps[activeStep] ? (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {curriculum.modules[activeModule].steps[activeStep].title}
                      </h2>
                      <p className="text-muted-foreground mt-1">
                        Module: {curriculum.modules[activeModule].title}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <p>{curriculum.modules[activeModule].steps[activeStep].description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Learning Resources</h3>
                      <div className="space-y-3">
                        {curriculum.modules[activeModule].steps[activeStep].resources.map((resource, i) => (
                          <Card key={i} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="font-medium">{resource.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                                  </p>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open
                                  </a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                      <Button 
                        onClick={handleGetAssignment}
                        variant="outline"
                      >
                        Get Practice Assignment
                      </Button>
                      <Button
                        onClick={handleMarkComplete}
                        disabled={curriculum.modules[activeModule].steps[activeStep].completed}
                      >
                        {curriculum.modules[activeModule].steps[activeStep].completed ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completed
                          </>
                        ) : (
                          "Mark as Complete"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>Select a module and step to begin learning</p>
                  </div>
                )}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="steps" className="border-none p-0">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold">
                    {curriculum.modules[activeModule]?.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {curriculum.modules[activeModule]?.description}
                  </p>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {curriculum.modules[activeModule]?.steps.map((step, stepIndex) => (
                    <AccordionItem key={stepIndex} value={`step-${stepIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          {step.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">
                              {stepIndex + 1}
                            </div>
                          )}
                          <span className="font-medium">{step.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pl-7 space-y-4">
                          <p className="text-sm">{step.description}</p>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setActiveStep(stepIndex);
                            }}
                          >
                            {step.completed ? "Review" : "Start Learning"}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}