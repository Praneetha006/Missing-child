import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Bell, Users, Eye, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import SearchFilters from "@/components/SearchFilters";
import LocationMap from "@/components/LocationMap";
import EmergencyContacts from "@/components/EmergencyContacts";
import LanguageSelector from "@/components/LanguageSelector";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [alertRes, reportRes, childRes] = await Promise.all([
        supabase.from("alerts").select("*").order("created_at", { ascending: false }),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("children").select("name, age, gender, photo_url, emergency_contact").limit(50),
      ]);
      setAlerts(alertRes.data || []);
      setReports(reportRes.data || []);
      setChildren(childRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("volunteer-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        toast.warning("🚨 New Panic Alert!");
        setAlerts((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, (payload) => {
        toast.info("📢 New Community Report!");
        setReports((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          toast.info("📋 A case was updated!");
          setReports((prev) => prev.map((r) => r.id === (payload.new as any).id ? payload.new as any : r));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filter children
  const filteredChildren = children.filter((c) => {
    if (searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (genderFilter !== "all" && c.gender !== genderFilter) return false;
    if (ageMin && c.age < parseInt(ageMin)) return false;
    if (ageMax && c.age > parseInt(ageMax)) return false;
    return true;
  });

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (searchQuery && !r.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !r.location?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (locationFilter && !r.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sortOrder === "newest"
    ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t("dashboard.volunteer")}</h1>
            <p className="text-sm opacity-80">{t("dashboard.welcome")}, {profile?.full_name || "Volunteer"} — {t("volunteer.readOnly")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector className="[&_button]:text-primary-foreground [&_svg]:text-primary-foreground" />
            <Button variant="secondary" size="sm" onClick={() => navigate("/sighting-report")}>
              <Eye className="h-4 w-4 mr-1" /> {t("sighting.title")}
            </Button>
            <Button variant="secondary" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4 mr-1" /> {t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t("volunteer.panicAlerts"), count: alerts.length, icon: Bell, color: "text-destructive" },
            { label: t("volunteer.missingReports"), count: reports.length, icon: Users, color: "text-primary" },
            { label: t("volunteer.childrenInfo"), count: children.length, icon: Eye, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-primary/20">
                <CardContent className="pt-6 text-center">
                  <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="alerts"><Bell className="h-4 w-4 mr-1" /> {t("volunteer.panicAlerts")}</TabsTrigger>
            <TabsTrigger value="reports"><Users className="h-4 w-4 mr-1" /> {t("volunteer.missingReports")}</TabsTrigger>
            <TabsTrigger value="children"><Eye className="h-4 w-4 mr-1" /> {t("volunteer.childrenInfo")}</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <Bell className="h-5 w-5" /> {t("volunteer.panicAlerts")}
                </CardTitle>
                <CardDescription>⚠️ {t("volunteer.cannotEdit")}</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((a) => (
                      <Card key={a.id} className="bg-destructive/5 border-destructive/20">
                        <CardContent className="pt-4 space-y-2">
                          <p className="font-medium">{a.message}</p>
                          <LocationMap latitude={a.latitude} longitude={a.longitude} address={a.location_address} />
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">{a.status}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                            </div>
                            <EmergencyContacts />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" /> {t("volunteer.missingReports")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SearchFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  genderFilter={genderFilter}
                  onGenderChange={setGenderFilter}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                  locationFilter={locationFilter}
                  onLocationChange={setLocationFilter}
                />
                {filteredReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reports found.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((r) => (
                      <Card key={r.id} className="bg-muted/50">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={r.type === "missing" ? "destructive" : "default"}>
                              {r.type === "missing" ? t("case.missing") : t("case.found")}
                            </Badge>
                            <Badge variant={r.status === "found" ? "default" : "secondary"}>
                              {r.status === "found" ? t("case.found") : t("case.missing")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                          <p className="font-medium">{r.description}</p>
                          <p className="text-sm text-muted-foreground">📍 {r.location}</p>
                          <EmergencyContacts />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="children">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Eye className="h-5 w-5" /> {t("volunteer.childrenInfo")} (Basic Info Only)
                </CardTitle>
                <CardDescription>⚠️ {t("volunteer.sensitiveHidden")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SearchFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  genderFilter={genderFilter}
                  onGenderChange={setGenderFilter}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                  ageMin={ageMin}
                  onAgeMinChange={setAgeMin}
                  ageMax={ageMax}
                  onAgeMaxChange={setAgeMax}
                />
                {filteredChildren.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No children found.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChildren.map((c, i) => (
                      <Card key={i} className="bg-muted/50">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center gap-3">
                            {c.photo_url ? (
                              <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {c.name?.[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{c.name}</p>
                              <p className="text-sm text-muted-foreground">{t("common.age")}: {c.age} · {c.gender || "N/A"}</p>
                            </div>
                          </div>
                          <EmergencyContacts guardianPhone={c.emergency_contact} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VolunteerDashboard;
