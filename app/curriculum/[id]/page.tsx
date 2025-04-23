'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, Clock, Badge } from "lucide-react";
import Link from 'next/link';

// --- Define types based on ACTUAL database schema --- 

// Structure within the 'modules' JSONB column
interface Resource {
  title: string;
  url: string;
}

interface Step {
  title: string;
  description: string;
  estimated_time?: string;
  resources?: Resource[];
  // Add is_completed later if needed for progress tracking
}

interface Module {
  title: string;
  description: string;
  steps: Step[];
}

// Structure matching the data fetched from Supabase
interface FetchedCurriculumData {
  id: string; // UUID
  title: string;
  description: string;
  experience_level: string;
  modules: Module[]; // This comes from the JSONB column
  skills: {
    skill_name: string; // Fetched via join
  } | null;
}

// --- REMOVED Mock Function --- 
// async function fetchMockCurriculumData(id: string | number): Promise<CurriculumData> { ... }

// --- Actual Supabase Fetch Function ---
async function fetchCurriculumDataFromDB(id: string): Promise<FetchedCurriculumData> {
  console.log("Fetching actual curriculum data for ID:", id);

  // Basic UUID check (can be improved)
  if (!id || id.length !== 36) { // Basic check for UUID format length
     throw new Error("Invalid curriculum ID format.");
  }

  const { data, error } = await supabase
    .from('curricula')
    .select(`
      id,
      title,
      description,
      experience_level,
      modules, 
      skills ( skill_name )
    `)
    .eq('id', id)
    .single(); // Expect only one curriculum for a given ID

  if (error) {
    console.error("Supabase fetch error:", error);
    if (error.code === 'PGRST116') { // Code for "Object not found"
        throw new Error(`Curriculum with ID '${id}' not found.`);
    }
    throw new Error(error.message || "Failed to fetch curriculum from database.");
  }

  if (!data) {
    throw new Error(`Curriculum with ID '${id}' not found.`);
  }

  // Validate the structure of the modules data (basic check)
  if (!Array.isArray(data.modules)) {
      console.warn("Fetched curriculum modules data is not an array:", data.modules);
      // Optionally handle this case, e.g., by setting modules to empty array
      // data.modules = []; 
      // Or throw an error if modules are strictly required
      throw new Error("Invalid modules data received from database.");
  }

  // Ensure skills relationship was fetched correctly
  if (!data.skills) {
     console.warn("Could not fetch related skill name for curriculum ID:", id);
     // Handle missing skill relation if necessary (e.g., display placeholder)
  }

  // Add type assertion if confident in the fetched structure
  return data as FetchedCurriculumData;
}

export default function CurriculumPage() {
  const params = useParams();
  // Ensure curriculumId is treated as string
  const curriculumId = typeof params.id === 'string' ? params.id : undefined;

  const [curriculum, setCurriculum] = useState<FetchedCurriculumData | null>(null);
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
        // Use the actual Supabase fetch function
        const data = await fetchCurriculumDataFromDB(curriculumId);
        setCurriculum(data);
      } catch (err: any) {
        console.error("Error loading curriculum:", err);
        setError(err.message || "Failed to load curriculum data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCurriculum();
  }, [curriculumId]); // Depend only on curriculumId

  // == UI Rendering ==

  if (isLoading) {
    return <CurriculumSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Curriculum</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!curriculum || !curriculum.skills) {
    return (
       <div className="container mx-auto py-8 px-4">
         <p className="text-center text-muted-foreground">Curriculum data not found or skill relation missing.</p>
       </div>
    );
  }

  // Remove progress calculation for now as is_completed is not stored yet
  // const totalSteps = curriculum.modules.reduce((sum, mod) => sum + mod.steps.length, 0);
  // const completedSteps = curriculum.modules.reduce((sum, mod) => 
  //   sum + mod.steps.filter(step => step.is_completed).length, 
  // 0);
  // const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-1">{curriculum.title}</h1>
      <div className="flex flex-wrap items-center gap-2 mb-6">
         <p className="text-lg text-muted-foreground">For skill:</p>
         <Badge variant="secondary" className="text-lg">{curriculum.skills.skill_name}</Badge>
         <Badge variant="outline" className="text-sm">Level: {curriculum.experience_level}</Badge>
      </div>
      
      {/* <p className="text-sm text-muted-foreground mb-6">Overall Progress: {progressPercent}% ({completedSteps}/{totalSteps} steps)</p> */}

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Render based on actual modules from JSONB */}
        {curriculum.modules.map((module, moduleIndex) => (
          <AccordionItem value={`module-${moduleIndex}`} key={moduleIndex} className="border rounded-lg overflow-hidden bg-card">
            <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline hover:bg-muted/50">
               <span className="mr-2 text-primary">{moduleIndex + 1}.</span> {module.title}
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-0 pb-4">
              <p className="text-muted-foreground mb-6 text-sm">{module.description}</p>
              {/* Use div instead of Card for steps for simpler layout */}
              <div className="space-y-6 pl-4"> 
                {module.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="border-l-2 pl-6 pr-2 border-border relative py-2 last:border-l-transparent">
                     <div className="absolute -left-[9px] top-3 bg-background border rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold text-muted-foreground">
                       {stepIndex + 1}
                     </div>
                     <h4 className="font-medium mb-1">{step.title}</h4>
                     <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                     {step.estimated_time && (
                       <div className="flex items-center text-xs text-muted-foreground mb-3">
                         <Clock className="h-3 w-3 mr-1.5" />
                         <span>{step.estimated_time}</span>
                       </div>
                     )}
                     {step.resources && step.resources.length > 0 && (
                       <div className="mt-3">
                         <h5 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Resources:</h5>
                         <ul className="space-y-2">
                           {step.resources.map((resource, resourceIndex) => (
                             <li key={resourceIndex}>
                               <Link 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-primary hover:underline flex items-center gap-1.5"
                                title={resource.url}
                                >
                                 <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                 <span className="break-words">{resource.title}</span>
                               </Link>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// Skeleton component remains the same
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