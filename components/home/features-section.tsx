import { Lightbulb, BookOpen, BarChart, Compass, Target, FileCheck } from "lucide-react";

const features = [
  {
    icon: <Lightbulb className="h-8 w-8" />,
    title: "Personalized Curriculums",
    description:
      "Create learning paths tailored to your experience level and learning style",
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "Free Learning Resources",
    description:
      "Discover the best free tutorials, articles, and videos from around the web",
  },
  {
    icon: <Compass className="h-8 w-8" />,
    title: "Step-by-Step Guidance",
    description:
      "Follow structured learning paths that build skills progressively",
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Adaptive Assignments",
    description:
      "Practice with tailored assignments and projects to reinforce your learning",
  },
  {
    icon: <BarChart className="h-8 w-8" />,
    title: "Progress Tracking",
    description:
      "Monitor your advancement through each module with clear visualizations",
  },
  {
    icon: <FileCheck className="h-8 w-8" />,
    title: "Custom Quizzes",
    description:
      "Test your knowledge with AI-generated quizzes specific to your learning path",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How Modulern Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform helps you learn any skill through a
            structured, personalized approach using the best free resources
            available online.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg border bg-background p-6 transition-all hover:shadow-md"
            >
              <div className="mb-4 text-primary">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}