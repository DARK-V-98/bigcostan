
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Target } from "lucide-react";

export default function VisionMission() {
  return (
    <section id="vision-mission" className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8 items-stretch">
        <Card className="rounded-2xl bg-card/50 flex flex-col backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <Eye className="h-10 w-10 text-primary" />
            <CardTitle className="font-headline">Our Vision</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              To build a legacy of construction excellence.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/50 flex flex-col backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <Target className="h-10 w-10 text-primary" />
            <CardTitle className="font-headline">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              We want to be the top choice for clients and a great place to work, &amp; To be the builder of choice for value-minded clients and high-performing employees.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
