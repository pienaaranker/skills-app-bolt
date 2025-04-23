"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  Feather,
  SquareUser,
  GraduationCap,
  SlidersHorizontal,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExperienceQuiz } from "@/components/skills/experience-quiz";
import { CustomQuiz } from "./components/CustomQuiz";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { CurriculumResponseType } from "@/app/api/curriculum/route";
import { CurriculumDisplay } from "./components/CurriculumDisplay";

// Types from CustomQuiz - consider moving these to a shared types file
interface QuestionOption {
  value: string;
  label: string;
}
interface QuizQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
}
interface AssessmentResult {
  level: "beginner" | "intermediate" | "advanced";
  rationale?: string;
  answers?: Record<string, string>; 
}
// End Types

interface Skill {
  id: number;
  name: string;
}

const formSchema = z.object({
  skillName: z.string().min(2, {
    message: "Skill name must be at least 2 characters.",
  }),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "custom"], {
    required_error: "Please select your experience level.",
  }),
});

export default function NewSkillPage() {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<AssessmentResult | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isFetchingSkills, setIsFetchingSkills] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // State for dynamic quiz questions
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenerationError, setQuizGenerationError] = useState<string | null>(null);

  // ---> NEW: State to hold the generated curriculum data
  const [generatedCurriculum, setGeneratedCurriculum] = useState<CurriculumResponseType | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      setIsFetchingSkills(true);
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('id, name')
          .order('name', { ascending: true })
          .limit(100);

        if (error) throw error;
        setSkills(data || []);
      } catch (error: any) {
        console.error("Error fetching skill suggestions:", error);
        setSkills([]);
      } finally {
        setIsFetchingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skillName: "",
      experienceLevel: "beginner",
    },
  });

  const watchExperienceLevel = form.watch("experienceLevel");
  const watchSkillName = form.watch("skillName");

  const shouldShowCustomQuiz = watchExperienceLevel === "custom";

  // Effect to fetch quiz questions when "custom" is selected and skillName is valid
  useEffect(() => {
    if (shouldShowCustomQuiz && watchSkillName && watchSkillName.length >= 2) {
      const fetchQuizQuestions = async () => {
        setIsGeneratingQuiz(true);
        setQuizGenerationError(null);
        setGeneratedQuestions(null); // Clear previous questions
        setQuizResults(null); // Clear previous assessment results
        console.log(`Fetching quiz questions for: ${watchSkillName}`);
        try {
          const response = await fetch('/api/quiz/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ skillName: watchSkillName }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to generate quiz questions.');
          }
          setGeneratedQuestions(data.questions);
        } catch (error: any) {
          console.error("Error fetching quiz questions:", error);
          setQuizGenerationError(error.message || "An unknown error occurred while generating the quiz.");
          setGeneratedQuestions(null);
        } finally {
          setIsGeneratingQuiz(false);
        }
      };

      // Debounce the fetch call slightly
      const timerId = setTimeout(() => {
         fetchQuizQuestions();
      }, 500); // 500ms debounce

      return () => clearTimeout(timerId); // Cleanup timeout on unmount or change

    } else {
       // Clear quiz state if custom is deselected or skill name becomes invalid
       setGeneratedQuestions(null);
       setIsGeneratingQuiz(false);
       setQuizGenerationError(null);
       setQuizResults(null); // Also clear results if the skill changes
    }
  }, [shouldShowCustomQuiz, watchSkillName]);

  const handleQuizComplete = (results: AssessmentResult) => {
    setQuizResults(results);
    toast({
      title: "Assessment complete",
      description: `AI Assessment: ${results.level}. ${results.rationale || 'We will use this context to generate your curriculum.'}`, 
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setGeneratedCurriculum(null); // Clear previous curriculum
    let statusToastId: string | undefined = undefined;

    try {
      // Initial Toast - Now directly for generation
      const { id, dismiss: dismissToast } = toast({
        title: "Generating Curriculum...",
        description: `Requesting path for "${values.skillName}". This may take a moment...`,
        duration: Infinity, // Keep toast open until manually dismissed or success/error
      });
      statusToastId = id;

      // --- Call the backend API to generate the curriculum --- 
      const generationResponse = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: values.skillName.trim(), // API expects 'skill'
          experienceLevel: values.experienceLevel,
          quizResults: values.experienceLevel === 'custom' ? quizResults?.rationale : undefined,
        }),
      });

      const generationResult = await generationResponse.json();

      if (!generationResponse.ok) {
        console.error("Curriculum Generation API Error:", generationResult);
        throw new Error(generationResult.message || 'Failed to generate curriculum.'); 
      }

      // Store the generated curriculum data in state
      setGeneratedCurriculum(generationResult as CurriculumResponseType);
      console.log("Successfully generated curriculum.", generationResult);
      
      // Update Toast: Dismiss old, show success
      if (statusToastId) dismiss(statusToastId);
      toast({ 
        title: "Curriculum Ready!",
        description: `Your learning path for "${values.skillName.trim()}" has been generated below.`,
        variant: "default",
        duration: 5000,
      });
      statusToastId = undefined; // Clear the ID

    } catch (error: any) {
      console.error("Error during curriculum generation request:", error);
      // Update toast on error: Dismiss old, show error
      if (statusToastId) {
        dismiss(statusToastId); // Use dismiss from useToast directly
      }
       toast({ 
         title: "Generation Failed",
         description: error.message || "Could not generate curriculum. Please try again.", 
         variant: "destructive",
         duration: 8000,
       });
       statusToastId = undefined; // Clear the ID
    } finally {
      setIsSubmitting(false);
    }
  }

  // Function to reset the view back to the form
  const handleResetForm = () => {
    setGeneratedCurriculum(null);
    form.reset(); // Reset form fields
    setQuizResults(null); // Reset quiz results
    setGeneratedQuestions(null); // Reset quiz questions
  };

  return (
    // Conditionally render based on generatedCurriculum state
    generatedCurriculum ? (
      <CurriculumDisplay 
        curriculumData={generatedCurriculum} 
        onReset={handleResetForm} 
      />
    ) : (
      // Original Form structure
      <div className="max-w-2xl w-full py-8"> {/* Added w-full */} 
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add a New Skill</h1>
          <p className="text-muted-foreground">
            Tell us what you want to learn and we'll create a personalized curriculum for you.
          </p>
        </div>

        <Card className="overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
              <CardHeader>
                <CardTitle>Skill Information</CardTitle>
                <CardDescription>
                  We'll use this to generate a learning path tailored to your experience level.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                 {/* Skill Name Field */}
                 <FormField
                   control={form.control}
                   name="skillName"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>What do you want to learn?</FormLabel>
                       <FormControl>
                         <Input
                           placeholder="e.g., JavaScript, UX Design, Python, etc."
                           {...field}
                         />
                       </FormControl>
                       <FormDescription>
                         Enter any skill, technology, or topic.
                       </FormDescription>
                        <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Experience Level Field */}
                 <FormField
                   control={form.control}
                   name="experienceLevel"
                   render={({ field }) => (
                     <FormItem className="space-y-3">
                       <FormLabel>What's your experience level?</FormLabel>
                       <FormControl>
                         <RadioGroup
                           onValueChange={(value) => {
                             field.onChange(value);
                             setGeneratedCurriculum(null); // Clear generated curriculum if level changes
                           }}
                           defaultValue={field.value}
                           className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                         >
                           {/* Beginner Option */}
                           <FormItem>
                             <FormControl>
                               <div className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary">
                                 <RadioGroupItem value="beginner" id="beginner" />
                                 <FormLabel className="flex-1 cursor-pointer flex items-center gap-3" htmlFor="beginner">
                                   <Feather className="h-5 w-5 text-muted-foreground" />
                                   <div>
                                     <div className="font-medium">Beginner</div>
                                     <p className="text-sm font-normal text-muted-foreground">
                                       New to this skill
                                     </p>
                                   </div>
                                 </FormLabel>
                               </div>
                             </FormControl>
                           </FormItem>
                           {/* Intermediate Option */}
                            <FormItem>
                              <FormControl>
                                <div className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary">
                                  <RadioGroupItem value="intermediate" id="intermediate" />
                                  <FormLabel className="flex-1 cursor-pointer flex items-center gap-3" htmlFor="intermediate">
                                    <SquareUser className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">Intermediate</div>
                                      <p className="text-sm font-normal text-muted-foreground">
                                        Have some experience
                                      </p>
                                    </div>
                                  </FormLabel>
                                </div>
                              </FormControl>
                            </FormItem>
                            {/* Advanced Option */}
                             <FormItem>
                               <FormControl>
                                 <div className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary">
                                   <RadioGroupItem value="advanced" id="advanced" />
                                   <FormLabel className="flex-1 cursor-pointer flex items-center gap-3" htmlFor="advanced">
                                     <GraduationCap className="h-5 w-5 text-muted-foreground" />
                                     <div>
                                       <div className="font-medium">Advanced</div>
                                       <p className="text-sm font-normal text-muted-foreground">
                                         Proficient, seeking mastery
                                       </p>
                                     </div>
                                   </FormLabel>
                                 </div>
                               </FormControl>
                             </FormItem>
                             {/* Custom Option */}
                              <FormItem>
                                <FormControl>
                                  <div className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-amber-500 has-[:checked]:border-2">
                                    <RadioGroupItem value="custom" id="custom" />
                                    <FormLabel className="flex-1 cursor-pointer flex items-center gap-3" htmlFor="custom">
                                      <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <div className="font-medium">Custom Assessment</div>
                                        <p className="text-xs text-muted-foreground">Answer a few questions</p>
                                      </div>
                                    </FormLabel>
                                  </div>
                                </FormControl>
                              </FormItem>
                         </RadioGroup>
                       </FormControl>
                        <FormMessage />
                     </FormItem>
                   )}
                 />

                {shouldShowCustomQuiz && (
                  <CustomQuiz
                    skillName={watchSkillName || "your chosen skill"}
                    onComplete={handleQuizComplete}
                    questions={generatedQuestions}
                    isLoading={isGeneratingQuiz}
                    error={quizGenerationError}
                  />
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || (shouldShowCustomQuiz && !quizResults)}
                  className="w-full"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Generating..." : "Generate Curriculum"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    )
  );
}