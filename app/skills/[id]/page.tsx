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
        
        // Fetch skill from Supabase
        const { data: skillData, error: skillError } = await supabase
          .from('skills')
          .select('*')
          .eq('id', skillId)
          .single();

        if (skillError) throw skillError;
        if (!skillData) throw new Error('Skill not found');
        
        setSkill(skillData);

        // Fetch curriculum from Supabase
        const { data: curriculumData, error: curriculumError } = await supabase
          .from('curricula')
          .select('*')
          .eq('skill_id', skillId)
          .single();

        if (curriculumError) throw curriculumError;
        if (!curriculumData) throw new Error('Curriculum not found');

        // Fetch assignments to mark completed steps
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .eq('skill_id', skillId);

        if (assignmentsError) throw assignmentsError;

        // Update completion status based on assignments
        const completedAssignments = assignmentsData || [];
        const updatedModules = curriculumData.modules.map((module: any, moduleIndex: number) => {
          const updatedSteps = module.steps.map((step: any, stepIndex: number) => {
            const isCompleted = completedAssignments.some(
              (assignment) => 
                assignment.module_index === moduleIndex && 
                (assignment.step_index === stepIndex || (assignment.step_index === -1 && stepIndex === module.steps.length - 1))
            );
            return { ...step, completed: isCompleted };
          });
          return { ...module, steps: updatedSteps };
        });
        
        setCurriculum({
          ...curriculumData,
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

  const handleComplete = async (moduleIndex: number, stepIndex: number) => {
    if (!curriculum || !skill) return;
    
    try {
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
      
      // Update skill progress in database
      const { error: skillError } = await supabase
        .from('skills')
        .update({
          current_step: totalCompleted,
          completed: totalCompleted === skill.total_steps
        })
        .eq('id', skill.id);

      if (skillError) throw skillError;
      
      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          skill_id: skill.id,
          module_index: moduleIndex,
          step_index: stepIndex,
          title: curriculum.modules[moduleIndex].steps[stepIndex].title,
          description: curriculum.modules[moduleIndex].steps[stepIndex].description,
          completed: true
        });

      if (assignmentError) throw assignmentError;
      
      // Update local skill state
      setSkill((prev: Skill | null) => {
        if (!prev) return null;
        return {
          ...prev,
          current_step: totalCompleted,
          completed: totalCompleted === prev.total_steps
        };
      });
      
      toast({
        title: "Progress saved",
        description: "You've completed this step!",
      });
    } catch (error: any) {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive",
      });
    }
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

  const handleAssignmentSubmit = async () => {
    if (!skill || !curriculum || !assignment) return;
    
    try {
      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          skill_id: skill.id,
          module_index: activeModule,
          step_index: activeStep,
          title: assignment.title,
          description: assignment.description,
          completed: true
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: "Assignment submitted",
        description: "Great job completing the assignment!",
      });

      // Close the assignment dialog
      setIsAssignmentOpen(false);

      // Update the curriculum view to show completion
      handleComplete(activeModule, activeStep);
    } catch (error: any) {
      toast({
        title: "Error submitting assignment",
        description: error.message,
        variant: "destructive",
      });
    }
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