import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Michael Johnson",
    role: "Software Developer",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
    testimonial:
      "Modulern helped me learn React from scratch. The curriculum was comprehensive and the resources were top-notch. I'm now confident in my React skills.",
  },
  {
    name: "Sarah Lee",
    role: "UX Designer",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    testimonial:
      "After struggling with unstructured tutorials, Modulern gave me a clear path to master UX design. The personalized assignments were especially helpful.",
  },
  {
    name: "David Wong",
    role: "Marketing Specialist",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    testimonial:
      "I needed to learn digital marketing quickly. Modulern's step-by-step approach and curated resources made it possible in just a few weeks.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how Modulern has helped people master new skills and
            transform their learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6 relative">
                <Quote className="text-primary/20 absolute top-4 right-4 h-12 w-12" />
                <p className="relative z-10 text-muted-foreground">
                  "{testimonial.testimonial}"
                </p>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.image} alt={testimonial.name} />
                  <AvatarFallback>
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}