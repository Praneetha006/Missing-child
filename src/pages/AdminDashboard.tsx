import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Shield, Users, Baby, Bell, FileText, MapPin, Eye } from "lucide-react";
import SearchFilters from "@/components/SearchFilters";
import LocationMap from "@/components/LocationMap";
import LanguageSelector from "@/components/LanguageSelector";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [sightings, setSightings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" } as never);
      if (data) {
        setIsAdmin(true);
        fetchAll();
      } else {
        toast.error("Access denied. Admin only.");
        navigate("/dashboard");
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        toast.info("📋 New user registered!");
        setUsers((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        toast.warning("🚨 New panic alert!");
        setAlerts((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, (payload) => {
        toast.info("📢 New report submitted!");
        setReports((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sightings" }, (payload) => {
        toast.info("👁️ New sighting report!");
        setSightings((prev) => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [userRes, childRes, alertRes, reportRes, sightRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("children").select("*, profiles!children_user_id_fkey(email, full_name)").order("created_at", { ascending: false }),
      supabase.from("alerts").select("*, profiles!alerts_user_id_fkey(email, full_name)").order("created_at", { ascending: false }),
      supabase.from("reports").select("*, profiles!reports_user_id_fkey(email, full_name)").order("created_at", { ascending: false }),
      supabase.from("sightings").select("*").order("created_at", { ascending: false }),
    ]);
    setUsers(userRes.data || []);
    setChildren(childRes.data || []);
    setAlerts(alertRes.data || []);
    setReports(reportRes.data || []);
    setSightings(sightRes.data || []);
    setLoading(false);
  };

  const updateStatus = async (userId: string, newStatus: string) => {
    const { error } = await supabase.from("profiles").update({ status: newStatus, verified: newStatus === "verified" }).eq("id", userId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`User ${newStatus === "verified" ? "approved" : "rejected"}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus, verified: newStatus === "verified" } : u));
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    const { error } = await supabase.from("reports").update({ status: newStatus } as never).eq("id", reportId);
    if (error) {
      toast.error("Failed to update report status");
    } else {
      toast.success(`Report marked as ${newStatus}`);
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: newStatus } : r));
    }
  };

  const filtered = roleFilter === "all" ? users : users.filter((u: any) => u.role === roleFilter);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">{t("dashboard.admin")}</h1>
              <p className="text-sm opacity-80">Complete system database access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector className="[&_button]:text-primary-foreground [&_svg]:text-primary-foreground" />
            <Button variant="secondary" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4 mr-1" /> {t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Registered Users", count: users.length, icon: Users, color: "text-primary" },
            { label: "Children", count: children.length, icon: Baby, color: "text-primary" },
            { label: "Panic Alerts", count: alerts.length, icon: Bell, color: "text-destructive" },
            { label: "Reports", count: reports.length, icon: FileText, color: "text-primary" },
            { label: "Sightings", count: sightings.length, icon: Eye, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Users</TabsTrigger>
            <TabsTrigger value="children"><Baby className="h-4 w-4 mr-1" /> Children</TabsTrigger>
            <TabsTrigger value="alerts"><Bell className="h-4 w-4 mr-1" /> Alerts</TabsTrigger>
            <TabsTrigger value="reports"><FileText className="h-4 w-4 mr-1" /> Reports</TabsTrigger>
            <TabsTrigger value="sightings"><Eye className="h-4 w-4 mr-1" /> Sightings</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Registered Users ({filtered.length})
                </CardTitle>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {loading ? <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p> : filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No users.</p> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.name")}</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>{t("common.email")}</TableHead>
                          <TableHead>{t("common.phone")}</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>{t("common.status")}</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((u: any) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.full_name}</TableCell>
                            <TableCell><Badge variant="secondary" className="capitalize">{u.role}</Badge></TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.phone}</TableCell>
                            <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={u.status === "verified" ? "default" : u.status === "rejected" ? "destructive" : "secondary"}>{u.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {u.status !== "verified" && <Button size="sm" onClick={() => updateStatus(u.id, "verified")}>Approve</Button>}
                                {u.status !== "rejected" && u.role !== "admin" && <Button size="sm" variant="destructive" onClick={() => updateStatus(u.id, "rejected")}>Reject</Button>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHILDREN TAB */}
          <TabsContent value="children">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Baby className="h-5 w-5 text-primary" /> Children Database ({children.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? <p className="text-center text-muted-foreground py-8">No children registered.</p> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parent Email</TableHead>
                          <TableHead>Child Name</TableHead>
                          <TableHead>{t("common.age")}</TableHead>
                          <TableHead>RFID Number</TableHead>
                          <TableHead>Smart ID Number</TableHead>
                          <TableHead>Emergency Contact</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {children.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell>{(c.profiles as any)?.email || "—"}</TableCell>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.age}</TableCell>
                            <TableCell className="font-mono">{c.rfid || "—"}</TableCell>
                            <TableCell className="font-mono">{c.smart_id || "—"}</TableCell>
                            <TableCell>{c.emergency_contact}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALERTS TAB */}
          <TabsContent value="alerts">
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive"><Bell className="h-5 w-5" /> Panic Alerts ({alerts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? <p className="text-center text-muted-foreground py-8">No alerts.</p> : (
                  <div className="space-y-4">
                    {alerts.map((a: any) => (
                      <Card key={a.id} className="bg-destructive/5 border-destructive/20">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="font-medium">{a.message}</p>
                              <p className="text-sm text-muted-foreground">By: {(a.profiles as any)?.email || "—"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">{a.status}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <LocationMap latitude={a.latitude} longitude={a.longitude} address={a.location_address} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Missing Reports ({reports.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? <p className="text-center text-muted-foreground py-8">No reports.</p> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parent Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>{t("common.details")}</TableHead>
                          <TableHead>{t("common.location")}</TableHead>
                          <TableHead>{t("common.status")}</TableHead>
                          <TableHead>Report Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{(r.profiles as any)?.email || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={r.type === "missing" ? "destructive" : "default"} className="capitalize">{r.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium max-w-xs truncate">{r.description}</TableCell>
                            <TableCell>{r.location}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === "found" ? "default" : "secondary"}>
                                {r.status === "found" ? t("case.found") : t("case.missing")}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <Select value={r.status} onValueChange={(v) => updateReportStatus(r.id, v)}>
                                <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">{t("case.missing")}</SelectItem>
                                  <SelectItem value="found">{t("case.found")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SIGHTINGS TAB */}
          <TabsContent value="sightings">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Sighting Reports ({sightings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sightings.length === 0 ? <p className="text-center text-muted-foreground py-8">No sightings.</p> : (
                  <div className="space-y-4">
                    {sightings.map((s: any) => (
                      <Card key={s.id} className="bg-muted/50">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-medium">{s.description}</p>
                            <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">📍 {s.location}</p>
                          {s.image_url && (
                            <img src={s.image_url} alt="Sighting" className="w-32 h-32 rounded-lg object-cover border" />
                          )}
                          <LocationMap latitude={s.latitude} longitude={s.longitude} address={s.location} />
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

export default AdminDashboard;
