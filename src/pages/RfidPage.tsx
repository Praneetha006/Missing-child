import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Radio, Scan } from "lucide-react";
import { motion } from "framer-motion";

const RfidPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [rfidScans, setRfidScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [childRes, scanRes] = await Promise.all([
      supabase.from("children").select("*").eq("user_id", user.id),
      supabase.from("rfid_scans").select("*").eq("user_id", user.id).order("scanned_at", { ascending: false }),
    ]);
    setChildren(childRes.data || []);
    setRfidScans(scanRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Realtime RFID scan notifications
  useEffect(() => {
    const channel = supabase
      .channel("rfid-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rfid_scans" }, (payload) => {
        const scan = payload.new as any;
        const child = children.find((c) => c.id === scan.child_id);
        toast.success(`🏫 ${child?.name || "Your child"} has reached ${scan.location}!`);
        setRfidScans((prev) => [scan, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [children]);

  const simulateRfidScan = async (child: any) => {
    if (!user) return;
    const { error } = await supabase.from("rfid_scans").insert({
      child_id: child.id,
      user_id: user.id,
      location: "School",
    } as never);
    if (error) {
      toast.error("Failed to simulate scan");
    } else {
      toast.success(`✅ Simulated: ${child.name} scanned at School`);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">RFID Tracking</h1>
              <p className="text-sm opacity-80">Monitor your child's RFID scans</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
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
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {children.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="border-primary/20">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        {c.photo_url ? (
                          <img src={c.photo_url} alt={c.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {c.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-lg">{c.name}</p>
                          <p className="text-sm text-muted-foreground">Age: {c.age}</p>
                        </div>
                      </div>
                      <div className="space-y-1 border-t pt-3">
                        <p className="text-sm"><span className="text-muted-foreground">RFID Number:</span> <span className="font-mono font-medium">{c.rfid || "Not assigned"}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">Parent Email:</span> {profile?.email}</p>
                      </div>
                      <Badge variant="secondary">Status: Safe</Badge>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => simulateRfidScan(c)}>
                        <Scan className="h-4 w-4 mr-1" /> Simulate School Scan
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {rfidScans.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg text-primary flex items-center gap-2">
                    <Scan className="h-5 w-5" /> Recent RFID Scan History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rfidScans.slice(0, 10).map((scan) => {
                    const child = children.find((c) => c.id === scan.child_id);
                    return (
                      <div key={scan.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm border">
                        <Badge variant="default">✅</Badge>
                        <span className="font-medium">{child?.name || "Child"}</span>
                        <span className="text-muted-foreground">reached {scan.location}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(scan.scanned_at).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RfidPage;
