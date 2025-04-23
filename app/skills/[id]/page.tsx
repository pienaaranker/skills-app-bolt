"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { CurriculumView } from "@/components/curriculum/curriculum-view";
import { AssignmentView } from "@/components/curriculum/assignment-view";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { GeneratedAssignment, GeneratedCurriculum, generateAssignment, generateCurriculum } from "@/lib/gemini";
import { Skill } from "@/types/supabase";

export default function SkillPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [curriculum, setCurriculum] = useState<GeneratedCurriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<GeneratedAssignment | null>(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);

  useEffect(() => {
    const skillId = params.id as string;
    
    // Function to fetch the skill and its curriculum
    const fetchSkillAndCurriculum = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we'd fetch from Supabase
        // For now, we'll simulate with mock data
        const mockSkill: Skill = {
          id: skillId,
          created_at: new Date().toISOString(),
          user_id: "user123",
          skill_name: "JavaScript",
          experience_level: "intermediate",
          current_step: 3,
          total_steps: 10,
          completed: false
        };
        
        setSkill(mockSkill);
        
        // Generate or fetch curriculum
        const generatedCurriculum = await generateCurriculum({
          skill: mockSkill.skill_name,
          experienceLevel: mockSkill.experience_level as any,
        });
        
        // Update completion status based on current_step
        let stepsCompleted = 0;
        const updatedModules = generatedCurriculum.modules.map((module) => {
          const updatedSteps = module.steps.map((step) => {
            const completed = stepsCompleted < mockSkill.current_step;
            if (completed) stepsCompleted++;
            return { ...step, completed };
          });
          return { ...module, steps: updatedSteps };
        });
        
        setCurriculum({
          ...generatedCurriculum,
          modules: updatedModules,
        });
      } catch (error: any) {
        toast({
          title: "Error loading skill",
          description: error.message,
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkillAndCurriculum();
  }, [params.id, router, toast]);

  const handleComplete = (moduleIndex: number, stepIndex: number) => {
    if (!curriculum) return;
    
    // Update the curriculum state to mark the step as completed
    const updatedModules = curriculum.modules.map((module, mIndex) => {
      if (mIndex === moduleIndex) {
        const updatedSteps = module.steps.map((step, sIndex) => {
          if (sIndex === stepIndex) {
            return { ...step, completed: true };
          }
          return step;
        });
        return { ...module, steps: updatedSteps };
      }
      return module;
    });
    
    setCurriculum({
      ...curriculum,
      modules: updatedModules,
    });
    
    // Calculate new current_step
    let totalCompleted = 0;
    updatedModules.forEach((module) => {
      module.steps.forEach((step) => {
        if (step.completed) totalCompleted++;
      });
    });
    
    // Update skill progress
    setSkill((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        current_step: totalCompleted,
      };
    });
    
    toast({
      title: "Progress saved",
      description: "You've completed this step!",
    });
    
    // In a real implementation, we would update the database
  };

  const handleRequestAssignment = async (moduleIndex: number, stepIndex: number) => {
    if (!curriculum || !skill) return;
    
    try {
      setActiveModule(moduleIndex);
      setActiveStep(stepIndex);
      
      // Generate assignment
      const generatedAssignment = await generateAssignment({
        skill: skill.skill_name,
        moduleTitle: curriculum.modules[moduleIndex].title,
        stepTitle: curriculum.modules[moduleIndex].steps[stepIndex].title,
        experienceLevel: skill.experience_level,
      });
      
      setAssignment(generatedAssignment);
      setIsAssignmentOpen(true);
    } catch (error: any) {
      toast({
        title: "Error generating assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignmentSubmit = () => {
    toast({
      title: "Assignment submitted",
      description: "Great job completing the assignment!",
    });
    
    // In a real implementation, we would save the assignment to the database
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading your curriculum...</p>
        </div>
      </div>
    );
  }

  if (!skill || !curriculum) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight">Skill not found</h1>
        <p className="text-muted-foreground mt-1">
          The skill you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <CurriculumView
        skill={skill}
        curriculum={curriculum}
        onComplete={handleComplete}
        onRequestAssignment={handleRequestAssignment}
      />
      
      <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
        <DialogContent className="max-w-3xl">
          {assignment && (
            <AssignmentView
              assignment={assignment}
              moduleTitle={curriculum.modules[activeModule].title}
              stepTitle={curriculum.modules[activeModule].steps[activeStep].title}
              onClose={() => setIsAssignmentOpen(false)}
              onSubmit={handleAssignmentSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}