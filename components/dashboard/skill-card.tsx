import Link from "next/link";
import { cva } from "class-variance-authority";
import { Skill } from "@/types/supabase";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const levelColors = cva("", {
  variants: {
    level: {
      beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      custom: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
  },
  defaultVariants: {
    level: "beginner",
  },
});

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const progress = skill.total_steps > 0
    ? Math.round((skill.current_step / skill.total_steps) * 100)
    : 0;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{skill.skill_name}</h3>
          <Badge 
            variant="outline" 
            className={levelColors({ level: skill.experience_level as any })}
          >
            {skill.experience_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {skill.current_step} of {skill.total_steps}</span>
            {skill.completed && (
              <span className="flex items-center text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Completed
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link href={`/skills/${skill.id}`}>
            {skill.completed ? "Review" : "Continue Learning"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}