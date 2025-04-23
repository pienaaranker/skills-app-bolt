import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-b from-primary/10 to-background">
      <div className="container">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <GraduationCap className="h-16 w-16 text-primary" />
          
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Your Learning Journey?
          </h2>
          
          <p className="text-lg text-muted-foreground">
            Join thousands of learners who have accelerated their skill development
            with Modulern's AI-powered learning paths.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button size="lg" className="w-full" asChild>
              <Link href="/auth">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/explore">Explore Skills</Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            No credit card required. Start learning in minutes.
          </p>
        </div>
      </div>
    </section>
  );
}