import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// This will be replaced by a form component later
// import PropertyForm from "@/components/property/PropertyForm";

export default function SubmitPropertyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">List Your Property</CardTitle>
          <CardDescription>Fill in the details below to list your property for sale or rent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* <PropertyForm /> */}
          <div className="text-center p-8 border border-dashed rounded-md">
            <h3 className="text-xl font-semibold mb-2">Property Form Coming Soon!</h3>
            <p className="text-muted-foreground mb-4">
              The form to submit property listings will be available here.
            </p>
            <Button variant="outline" asChild>
              <Link href="/properties">Back to Properties</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
