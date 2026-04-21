import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Radio, CreditCard, Bell, Users, Plus, Eye } from "lucide-react";
import { motion } from "framer-motion";
import LanguageSelector from "@/components/LanguageSelector";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { t } = useLanguage();
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from("children").select("*").eq("user_id", user.id).then(({ data }) => setChildren(data || []));
    }
  }, [user]);

  // Realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        const alert = payload.new as any;
        // Broadcast panic alert to ALL users (community-wide awareness)
        toast.warning(`🚨 PANIC ALERT: ${alert.message?.slice(0, 120) || "Emergency near you"}`, {
          duration: 10000,
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, (payload) => {
        const report = payload.new as any;
        // Broadcast missing-child reports to EVERYONE for community awareness
        if (report.type === "missing") {
          toast.warning(`🔍 MISSING CHILD reported at ${report.location}. Please keep watch!`, {
            duration: 10000,
          });
        } else if (report.type === "found") {
          toast.success(`💚 A child has been reported FOUND at ${report.location}`);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reports" }, (payload) => {
        const report = payload.new as any;
        // TARGETED notification: parent who originally reported the missing child
        if (user && report.user_id === user.id && report.status === "found") {
          toast.success(
            `🎉 GREAT NEWS! Your missing-child case has been marked as FOUND. Please contact authorities to confirm.`,
            { duration: 15000 }
          );
        } else {
          toast.info(`📋 A case status was updated to "${report.status}"`);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sightings" }, async (payload) => {
        const sighting = payload.new as any;
        // If this sighting is linked to a report, notify the original reporting parent specifically
        if (sighting.linked_report_id && user) {
          const { data: linkedReport } = await supabase
            .from("reports")
            .select("user_id, description")
            .eq("id", sighting.linked_report_id)
            .single();
          if (linkedReport?.user_id === user.id) {
            toast.success(
              `👁️ Someone has SPOTTED your missing child! Location: ${sighting.location}. Check Sightings for details.`,
              { duration: 15000 }
            );
            return;
          }
        }
        toast.info(`👁️ New sighting reported at ${sighting.location}`);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rfid_scans" }, (payload) => {
        const scan = payload.new as any;
        const child = children.find((c) => c.id === scan.child_id);
        toast.success(`🏫 ${child?.name || "Your child"} has reached ${scan.location}!`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [children, user]);

  const solutions = [
    { key: "rfid", icon: Radio, title: t("solution.rfid"), desc: t("solution.rfid.desc"), path: "/rfid" },
    { key: "smartid", icon: CreditCard, title: t("solution.smartid"), desc: t("solution.smartid.desc"), path: "/smart-id" },
    { key: "panic", icon: Bell, title: t("solution.panic"), desc: t("solution.panic.desc"), path: "/panic-alert", color: "text-destructive" },
    { key: "community", icon: Users, title: t("solution.community"), desc: t("solution.community.desc"), path: "/community-report" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t("dashboard.parent")}</h1>
            <p className="text-sm opacity-80">{t("dashboard.welcome")}, {profile?.full_name || "User"}</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <LanguageSelector className="[&_button]:text-primary-foreground [&_svg]:text-primary-foreground" />
            <Button variant="secondary" size="sm" onClick={() => navigate("/sighting-report")}>
              <Eye className="h-4 w-4 mr-1" /> {t("sighting.title")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/register-child")}>
              <Plus className="h-4 w-4 mr-1" /> {t("dashboard.registerChild")}
            </Button>
            <Button variant="secondary" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4 mr-1" /> {t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {children.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-primary">{t("dashboard.yourChildren")} ({children.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {children.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {c.name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{t("common.age")}: {c.age} · RFID: {c.rfid || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {solutions.map((s, i) => (
            <motion.div key={s.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-primary/20" onClick={() => navigate(s.path)}>
                <CardHeader className="text-center pb-2">
                  <s.icon className={`h-10 w-10 mx-auto mb-2 ${s.color || "text-primary"}`} />
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-xs">{s.desc}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {children.length === 0 && (
          <Card className="border-dashed border-2 border-primary/20">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No children registered yet.</p>
              <Button onClick={() => navigate("/register-child")}>
                <Plus className="h-4 w-4 mr-1" /> {t("dashboard.registerChild")}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
