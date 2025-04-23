import Link from "next/link";
import { GraduationCap, Settings, Users, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50 z-10" />
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg')] bg-cover bg-center opacity-10" />
      
      <div className="container relative z-20 py-24 md:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-primary">Introducing Modulern</span>
            <div className="mx-1 h-1 w-1 rounded-full bg-border" />
            <span className="text-muted-foreground">AI-Powered Learning</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Learn Any Skill with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Personalized</span> Curriculum
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Modulern uses AI to create personalized learning paths with free resources
            tailored to your experience level and learning style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button size="lg" className="w-full" asChild>
              <Link href="/auth">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}