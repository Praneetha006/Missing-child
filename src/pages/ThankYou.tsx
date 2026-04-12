import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Shield, HandHeart } from "lucide-react";

const ThankYou = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        <Heart className="h-16 w-16 text-primary-foreground mx-auto" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
          Thank You for Your Participation
        </h1>
        <p className="text-primary-foreground/80 text-lg">
          Together, we can make a difference in child safety through community cooperation and ethical technology.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Users, text: "Community participation saves lives" },
            { icon: Shield, text: "Responsible reporting protects children" },
            { icon: HandHeart, text: "Ethical technology respects privacy" },
          ].map((item) => (
            <Card key={item.text} className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="pt-6 text-center">
                <item.icon className="h-8 w-8 text-primary-foreground mx-auto mb-3" />
                <p className="text-primary-foreground text-sm">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="secondary" size="lg" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default ThankYou;
