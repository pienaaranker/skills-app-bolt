import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentActivities() {
  const activities = [
    {
      type: "step_completed",
      skillName: "JavaScript",
      moduleName: "ES6 Fundamentals",
      stepName: "Arrow Functions",
      date: "2 hours ago"
    },
    {
      type: "assignment_completed",
      skillName: "UX Design",
      moduleName: "User Research",
      assignmentName: "Create User Personas",
      date: "Yesterday"
    },
    {
      type: "new_skill",
      skillName: "Python",
      experienceLevel: "Intermediate",
      date: "2 days ago"
    },
    {
      type: "step_completed",
      skillName: "UX Design",
      moduleName: "Wireframing",
      stepName: "Low-Fidelity Prototypes",
      date: "2 days ago"
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Your latest learning activities</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 divide-y">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="grid gap-1">
                {activity.type === "step_completed" && (
                  <p className="text-sm">
                    Completed <span className="font-medium">{activity.stepName}</span> in{" "}
                    <span className="text-primary">{activity.skillName}</span>
                  </p>
                )}
                {activity.type === "assignment_completed" && (
                  <p className="text-sm">
                    Completed assignment <span className="font-medium">{activity.assignmentName}</span> for{" "}
                    <span className="text-primary">{activity.skillName}</span>
                  </p>
                )}
                {activity.type === "new_skill" && (
                  <p className="text-sm">
                    Started learning <span className="text-primary">{activity.skillName}</span> at{" "}
                    <span className="font-medium">{activity.experienceLevel}</span> level
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}