import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const SmartIdPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase.from("children").select("*").eq("user_id", user.id).then(({ data }) => {
        setChildren(data || []);
        setLoading(false);
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">Smart ID Identification</h1>
              <p className="text-sm opacity-80">Child Smart ID details</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : children.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No children registered. Register a child first.</p>
              <Button className="mt-4" onClick={() => navigate("/register-child")}>Register Child</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {children.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-primary/20 overflow-hidden">
                  <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">SMART ID CARD</span>
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-4">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="w-20 h-20 rounded-lg object-cover border-2 border-primary/30" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-10 w-10 text-primary/50" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="font-bold text-xl">{c.name}</p>
                        <p className="text-sm text-muted-foreground">Age: {c.age} · {c.gender || "N/A"}</p>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Smart ID</span>
                        <span className="font-mono font-medium">{c.smart_id || "Not assigned"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Parent Name</span>
                        <span className="font-medium">{profile?.full_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Parent Email</span>
                        <span className="font-medium">{profile?.email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Emergency Contact</span>
                        <span className="font-medium">{c.emergency_contact}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SmartIdPage;
