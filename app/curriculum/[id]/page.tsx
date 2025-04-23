'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // For fetching data later
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, CheckCircle } from "lucide-react";
import Link from 'next/link';

// Define types for curriculum structure (consider moving to shared types file)
interface Step {
  id: number; // Assuming steps have IDs from DB later
  title: string;
  resource_url: string;
  is_completed?: boolean; // For progress tracking later
}

interface Module {
  id: number; // Assuming modules have IDs from DB later
  title: string;
  steps: Step[];
}

interface CurriculumData {
  id: number;
  title: string;
  skill_name: string; // Need skill name for display
  modules: Module[];
}

// Mock data fetching function
async function fetchMockCurriculumData(id: string | number): Promise<CurriculumData> {
  console.log("Fetching mock curriculum data for ID:", id);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  
  // Check if ID is valid (basic check)
  if (isNaN(Number(id)) || Number(id) <= 0) {
    throw new Error("Invalid curriculum ID.");
  }

  // Return mock data matching the structure
  return {
    id: Number(id),
    title: `Learning Path for Mock Skill ${id}`,
    skill_name: `Mock Skill ${id}`,
    modules: [
      {
        id: 101,
        title: "Module 1: Fundamentals",
        steps: [
          { id: 1001, title: "Understand Core Concept A", resource_url: "https://example.com/concept-a", is_completed: true },
          { id: 1002, title: "Practice Basic Setup", resource_url: "https://example.com/setup", is_completed: false },
          { id: 1003, title: "Read Introduction Guide", resource_url: "https://example.com/intro-guide", is_completed: false },
        ],
      },
      {
        id: 102,
        title: "Module 2: Intermediate Techniques",
        steps: [
          { id: 1004, title: "Explore Technique B", resource_url: "https://example.com/technique-b", is_completed: false },
          { id: 1005, title: "Build Small Project", resource_url: "https://example.com/project-1", is_completed: false },
        ],
      },
       {
        id: 103,
        title: "Module 3: Advanced Application",
        steps: [
          { id: 1006, title: "Deep Dive into Feature C", resource_url: "https://example.com/feature-c", is_completed: false },
        ],
      },
    ],
  };
}

export default function CurriculumPage() {
  const params = useParams();
  const curriculumId = params.id as string;

  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!curriculumId) {
      setError("Curriculum ID not found in URL.");
      setIsLoading(false);
      return;
    }

    const loadCurriculum = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Replace with actual Supabase fetch later
        const data = await fetchMockCurriculumData(curriculumId);
        setCurriculum(data);
      } catch (err: any) {
        console.error("Error loading curriculum:", err);
        setError(err.message || "Failed to load curriculum data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCurriculum();
  }, [curriculumId]);

  // == UI Rendering ==

  if (isLoading) {
    return <CurriculumSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!curriculum) {
    return (
       <div className="container mx-auto py-8 px-4">
         <p className="text-center text-muted-foreground">Curriculum data not found.</p>
       </div>
    );
  }

  // Calculate overall progress (simple example)
  const totalSteps = curriculum.modules.reduce((sum, mod) => sum + mod.steps.length, 0);
  const completedSteps = curriculum.modules.reduce((sum, mod) => 
    sum + mod.steps.filter(step => step.is_completed).length, 
  0);
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{curriculum.title}</h1>
      <p className="text-lg text-muted-foreground mb-6">Your personalized learning journey for <span className='font-semibold'>{curriculum.skill_name}</span>.</p>
      
      {/* TODO: Add Progress Bar Component Here */} 
      <p className="text-sm text-muted-foreground mb-6">Overall Progress: {progressPercent}% ({completedSteps}/{totalSteps} steps)</p>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {curriculum.modules.map((module, index) => (
          <AccordionItem value={`module-${module.id}`} key={module.id} className="border rounded-lg overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline hover:bg-muted/50">
              Module {index + 1}: {module.title}
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-0 pb-4 space-y-3">
              {module.steps.map((step) => (
                <Card key={step.id} className={`flex items-center justify-between p-3 ${step.is_completed ? 'bg-emerald-50 border-emerald-200' : 'bg-background'}`}>
                  <div className="flex items-center space-x-3">
                     {/* TODO: Add Checkbox for progress tracking */} 
                     {step.is_completed && <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />} 
                     {!step.is_completed && <div className="h-5 w-5 border rounded border-muted-foreground flex-shrink-0"></div>} 
                    <span className={step.is_completed ? 'text-muted-foreground line-through' : ''}>{step.title}</span>
                  </div>
                  <Link href={step.resource_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center space-x-1">
                     <span>Resource</span>
                     <ExternalLink className="h-4 w-4" />
                  </Link>
                </Card>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// Skeleton component for loading state
function CurriculumSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Skeleton className="h-9 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-6" />
      <Skeleton className="h-5 w-1/4 mb-6" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
           <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
} 