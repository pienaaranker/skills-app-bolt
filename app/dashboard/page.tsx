"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SkillCard } from "@/components/dashboard/skill-card";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { supabase } from "@/lib/supabase/client";
import { Skill } from "@/types/supabase";

export default function DashboardPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // This is a mock implementation - in production, this would pull from the Supabase database
          // Simulating skills data for demonstration
          const mockSkills: Skill[] = [
            {
              id: "1",
              created_at: new Date().toISOString(),
              user_id: user.id,
              skill_name: "JavaScript",
              experience_level: "intermediate",
              current_step: 15,
              total_steps: 30,
              completed: false
            },
            {
              id: "2",
              created_at: new Date().toISOString(),
              user_id: user.id,
              skill_name: "UX Design",
              experience_level: "beginner",
              current_step: 10,
              total_steps: 25,
              completed: false
            },
            {
              id: "3",
              created_at: new Date().toISOString(),
              user_id: user.id,
              skill_name: "Python",
              experience_level: "intermediate",
              current_step: 3,
              total_steps: 20,
              completed: false
            },
            {
              id: "4",
              created_at: new Date().toISOString(),
              user_id: user.id,
              skill_name: "Digital Marketing",
              experience_level: "beginner",
              current_step: 12,
              total_steps: 12,
              completed: true
            }
          ];
          
          setSkills(mockSkills);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const filteredSkills = skills.filter(skill => {
    if (activeTab === "all") return true;
    if (activeTab === "in-progress") return !skill.completed;
    if (activeTab === "completed") return skill.completed;
    return true;
  });

  return (
    <div className="py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your learning progress and start where you left off.
            </p>
          </div>
          <Button asChild>
            <Link href="/new-skill">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Skill
            </Link>
          </Button>
        </div>

        <StatsCards skills={skills} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Tabs 
              defaultValue="all" 
              className="space-y-4"
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="all">All Skills</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {isLoading ? (
                    <p>Loading skills...</p>
                  ) : filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <h3 className="text-lg font-medium">No skills found</h3>
                      <p className="text-muted-foreground mt-1">
                        Start by adding a new skill to learn.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/new-skill">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add New Skill
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="in-progress" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <h3 className="text-lg font-medium">No skills in progress</h3>
                      <p className="text-muted-foreground mt-1">
                        All your skills are completed or you haven't added any yet.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="completed" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <h3 className="text-lg font-medium">No completed skills</h3>
                      <p className="text-muted-foreground mt-1">
                        Keep learning to complete your skills.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <RecentActivities />
          </div>
        </div>
      </div>
    </div>
  );
}