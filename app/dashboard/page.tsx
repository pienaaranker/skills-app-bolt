"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SkillCard } from "@/components/dashboard/skill-card";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { supabase } from "@/lib/supabase/client";
import { Skill } from "@/types/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      setError(null);
      setSkills([]);

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("Auth error fetching user:", authError);
          throw new Error("Authentication failed. Please log in again.");
        }

        console.log("Fetching skills for user:", user.id);
        const { data: fetchedSkills, error: fetchError } = await supabase
          .from('skills')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error("Error fetching skills from Supabase:", fetchError);
          throw new Error(`Failed to load your skills data: ${fetchError.message}`);
        }

        console.log("Fetched skills:", fetchedSkills);
        setSkills((fetchedSkills as Skill[]) || []);
      } catch (error: any) {
        console.error("Error in fetchSkills useEffect:", error);
        setError(error.message || "An unexpected error occurred.");
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const filteredSkills = skills.filter(skill => {
    if (!skill || typeof skill.completed === 'undefined') return false;
    if (activeTab === "all") return true;
    if (activeTab === "in-progress") return !skill.completed;
    if (activeTab === "completed") return skill.completed;
    return true;
  });

  const renderSkillList = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full text-center py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Skills</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (filteredSkills.length === 0) {
      let emptyMessage = "Start by adding a new skill to learn.";
      if (activeTab === "in-progress") emptyMessage = "No skills currently in progress.";
      if (activeTab === "completed") emptyMessage = "You haven't completed any skills yet.";
      return (
        <div className="col-span-full text-center py-12">
          <h3 className="text-lg font-medium">No Skills Found</h3>
          <p className="text-muted-foreground mt-1">{emptyMessage}</p>
          <Button asChild className="mt-4">
            <Link href="/new-skill">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Skill
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredSkills.map((skill) => 
           skill && typeof skill.id === 'string' && skill.id.length > 0 ? (
              <SkillCard key={skill.id} skill={skill} />
           ) : null
        )}
      </div>
    );
  };

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
              <TabsContent value="all" className="mt-4 min-h-[200px]">{renderSkillList()}</TabsContent>
              <TabsContent value="in-progress" className="mt-4 min-h-[200px]">{renderSkillList()}</TabsContent>
              <TabsContent value="completed" className="mt-4 min-h-[200px]">{renderSkillList()}</TabsContent>
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