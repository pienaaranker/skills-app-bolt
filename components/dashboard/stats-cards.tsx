import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, Trophy } from "lucide-react";
import { Skill } from "@/types/supabase";

interface StatsCardsProps {
  skills: Skill[];
}

export function StatsCards({ skills }: StatsCardsProps) {
  // Calculate statistics
  const totalSkills = skills.length;
  const completedSkills = skills.filter(skill => skill.completed).length;
  
  // Calculate total steps and completed steps across all skills
  const totalSteps = skills.reduce((acc, skill) => acc + skill.total_steps, 0);
  const completedSteps = skills.reduce((acc, skill) => acc + skill.current_step, 0);
  
  // Calculate completion rate
  const completionRate = totalSteps > 0 
    ? Math.round((completedSteps / totalSteps) * 100) 
    : 0;
  
  // Estimate time spent (mock calculation - in a real app this would be tracked)
  const estimatedHoursSpent = completedSteps * 1.5; // Assuming 1.5 hours per step

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Skills In Progress</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSkills}</div>
          <p className="text-xs text-muted-foreground">
            {completedSkills} completed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {completedSteps} of {totalSteps} steps
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">7 days</div>
          <p className="text-xs text-muted-foreground">
            Last active: Today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estimatedHoursSpent} hrs</div>
          <p className="text-xs text-muted-foreground">
            Avg. 2.5 hrs/day
          </p>
        </CardContent>
      </Card>
    </div>
  );
}