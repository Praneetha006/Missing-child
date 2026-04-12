import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Baby, ArrowRight } from "lucide-react";

const ChildCheck = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <Baby className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl text-primary">Do You Have Children?</CardTitle>
          <CardDescription>
            If yes, you'll be asked to register your child's details for safety purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" onClick={() => navigate("/register-child")}>
            Yes, Register My Child <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full" size="lg" onClick={() => navigate("/dashboard")}>
            No, Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildCheck;
