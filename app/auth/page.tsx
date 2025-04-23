"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  const handleSuccess = () => {
    router.push("/dashboard");
  };

  return (
    <div className="container relative min-h-screen flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-indigo-900" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <GraduationCap className="h-6 w-6" />
          <span>Modulern</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Modulern has completely transformed how I learn new skills. The personalized curriculum made all the difference in my journey to mastering web development.&rdquo;
            </p>
            <footer className="text-sm">Sophia Chen</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-8 lg:p-8 flex w-full flex-col justify-center space-y-6 lg:max-w-md mx-auto">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {activeTab === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "signin"
              ? "Enter your credentials to access your account"
              : "Sign up to start your personalized learning journey"}
          </p>
        </div>
        <Card>
          <CardHeader className="p-4 pb-0">
            <Tabs defaultValue="signin" onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <AuthForm mode="signin" onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <AuthForm mode="signup" onSuccess={handleSuccess} />
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}