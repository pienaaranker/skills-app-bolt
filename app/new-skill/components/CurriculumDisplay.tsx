'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { CurriculumResponseType } from "@/app/api/curriculum/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, Loader2, Save } from "lucide-react";

interface CurriculumDisplayProps {
  curriculumData: CurriculumResponseType;
  onReset: () => void; // Function to allow going back to the form
}

export function CurriculumDisplay({ curriculumData, onReset }: CurriculumDisplayProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { skill, experienceLevel, curriculum } = curriculumData;

  const handleAcceptCurriculum = async () => {
    setIsSaving(true);
    let statusToastId: string | undefined = undefined;

    try {
      // Show loading toast
      const { id, dismiss: dismissToast } = toast({
        title: "Saving Curriculum...",
        description: "Adding this curriculum to your profile.",
        duration: Infinity,
      });
      statusToastId = id;

      // Call the save API endpoint
      const response = await fetch('/api/curriculum/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curriculumData), // Send the whole data object
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save curriculum.');
      }

      // Handle success
      const newCurriculumId = result.curriculumId;
      if (!newCurriculumId || typeof newCurriculumId !== 'string' || newCurriculumId.length === 0) {
        console.error("Invalid or missing curriculumId string received from save API:", result);
        throw new Error("Save successful but did not receive a valid curriculum ID string.");
      }

      if (statusToastId) dismiss(statusToastId);
      toast({
        title: "Curriculum Saved!",
        description: `Curriculum for "${skill}" added to your profile. Redirecting...`,
        variant: "default",
      });

      // Redirect to the newly saved curriculum page
      router.push(`/curriculum/${newCurriculumId}`);

    } catch (error: any) {
      console.error("Error saving curriculum:", error);
      if (statusToastId) dismiss(statusToastId);
      toast({
        title: "Save Failed",
        description: error.message || "Could not save curriculum. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false); // Only set to false on error, redirect handles success case
    }
    // No finally block needed as success involves redirect
  };

  // Basic check in case the curriculum object itself is missing
  if (!curriculum) {
    return (
      <div className="max-w-4xl w-full py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not display curriculum data.</p>
            <Button variant="outline" size="sm" onClick={onReset} className="mt-4">Start Over</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full py-8"> {/* Ensure it takes width */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4"> {/* Added gap */}
            <div className="flex-1"> {/* Allow text to wrap */}
              <CardTitle className="text-2xl mb-2">{curriculum.title || "Generated Curriculum"}</CardTitle>
              <CardDescription>{curriculum.description || "Here is your personalized learning path."}</CardDescription>
            </div>
            {/* Buttons: Accept & Save / Start New */}
            <div className="flex gap-2 flex-shrink-0"> 
              <Button variant="outline" size="sm" onClick={onReset} disabled={isSaving}>Start New</Button>
              <Button size="sm" onClick={handleAcceptCurriculum} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Accept & Save</>
                )}
              </Button>
            </div>
          </div>
          {/* Display skill and level */}
          <div className="flex flex-wrap gap-2 pt-4"> {/* Added flex-wrap */}
            <Badge variant="secondary">{skill}</Badge>
            <Badge variant="outline">{experienceLevel}</Badge> {/* Use outline for level */}
          </div>
        </CardHeader>
        <CardContent>
          {/* Accordion for modules */}
          <Accordion type="single" collapsible className="w-full">
            {curriculum.modules.map((module, moduleIndex) => (
              <AccordionItem value={`module-${moduleIndex}`} key={moduleIndex}>
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  {/* Added module number for clarity */}
                  <span className="mr-2 text-primary">{moduleIndex + 1}.</span> {module.title}
                </AccordionTrigger>
                <AccordionContent>
                  {/* Module description */}
                  <p className="text-muted-foreground mb-6">{module.description}</p>
                  {/* Steps within the module */}
                  <div className="space-y-6 pl-4"> {/* Indent steps slightly */}
                    {module.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="border-l-2 pl-6 pr-2 border-border relative py-2 last:border-l-transparent"> {/* Added left border & padding */}
                         {/* Step number indicator using pseudo-element might be cleaner, but this works */}
                         <div className="absolute -left-[9px] top-3 bg-background border rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold text-muted-foreground">
                           {stepIndex + 1}
                         </div>
                         {/* Step title */}
                         <h4 className="font-medium mb-1">{step.title}</h4>
                         {/* Step description */}
                         <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                         {/* Estimated time */}
                         {step.estimated_time && (
                           <div className="flex items-center text-xs text-muted-foreground mb-3">
                             <Clock className="h-3 w-3 mr-1.5" /> {/* Slightly more margin */}
                             <span>{step.estimated_time}</span>
                           </div>
                         )}
                         {/* Resources list */}
                         {step.resources && step.resources.length > 0 && (
                           <div className="mt-3">
                             <h5 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Resources:</h5>
                             <ul className="space-y-2">
                               {step.resources.map((resource, resourceIndex) => (
                                 <li key={resourceIndex}>
                                   <a
                                     href={resource.url}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="text-sm text-primary hover:underline flex items-center gap-1.5" // Slightly more gap
                                     title={resource.url} // Add tooltip for URL
                                   >
                                     <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" /> {/* Slightly larger icon */}
                                     <span className="break-words">{resource.title}</span> {/* Allow wrapping */}
                                   </a>
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
        </CardContent>
      </Card>
    </div>
  );
} 