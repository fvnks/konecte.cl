import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// This will be replaced by a form component later
// import RequestForm from "@/components/request/RequestForm";

export default function SubmitRequestPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Post Your Property Request</CardTitle>
          <CardDescription>Let others know what kind of property you are looking for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* <RequestForm /> */}
           <div className="text-center p-8 border border-dashed rounded-md">
            <h3 className="text-xl font-semibold mb-2">Request Form Coming Soon!</h3>
            <p className="text-muted-foreground mb-4">
              The form to post property search requests will be available here.
            </p>
            <Button variant="outline" asChild>
              <Link href="/requests">Back to Requests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
