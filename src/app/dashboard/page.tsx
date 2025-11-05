import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
          <CardDescription>
            This is your control center. You can manage user roles and upload new project images using the navigation above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>More dashboard widgets and analytics will be available here in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}
