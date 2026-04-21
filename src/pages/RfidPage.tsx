import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Radio, Scan, School, MapPin, Clock, Info, CheckCircle2,
  Pencil, ShieldCheck, ShieldAlert, AlarmClock, Play, Pause,
} from "lucide-react";
import { motion } from "framer-motion";

const SCAN_LOCATIONS = ["School", "School Bus", "Tuition Center", "Daycare", "Park", "Sports Club"];
const SCHEDULE_KEY = "rfid_schedule_v1"; // { [childId]: { location, expectedTime "HH:MM" } }

type Schedule = Record<string, { location: string; expectedTime: string }>;

const loadSchedule = (): Schedule => {
  try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || "{}"); } catch { return {}; }
};
const saveSchedule = (s: Schedule) => localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s));

const RfidPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [children, setChildren] = useState<any[]>([]);
  const [rfidScans, setRfidScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLocation, setScanLocation] = useState("School");

  // Edit RFID dialog
  const [editChild, setEditChild] = useState<any | null>(null);
  const [editRfid, setEditRfid] = useState("");
  const [savingRfid, setSavingRfid] = useState(false);

  // Schedules (local-only, per-device)
  const [schedule, setSchedule] = useState<Schedule>(loadSchedule());
  const [scheduleChild, setScheduleChild] = useState<any | null>(null);
  const [schedLocation, setSchedLocation] = useState("School");
  const [schedTime, setSchedTime] = useState("08:30");

  // Auto-scan
  const [autoScan, setAutoScan] = useState(false);
  const autoTimer = useRef<number | null>(null);
  const missedAlerted = useRef<Set<string>>(new Set()); // childId-date keys

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
        if (child) {
          toast.success(`🏫 ${child.name} reached ${scan.location}!`, {
            description: new Date(scan.scanned_at).toLocaleTimeString(),
            duration: 6000,
          });
          setRfidScans((prev) => [scan, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [children]);

  // ---- Helper: today's scans per child ----
  const todayKey = new Date().toDateString();
  const latestScanPerChild = useMemo(() => {
    const map: Record<string, any> = {};
    for (const s of rfidScans) {
      if (!map[s.child_id]) map[s.child_id] = s;
    }
    return map;
  }, [rfidScans]);

  const isScannedToday = (childId: string) => {
    const last = latestScanPerChild[childId];
    return last && new Date(last.scanned_at).toDateString() === todayKey;
  };

  const insertScan = async (childId: string, location: string) => {
    if (!user) return false;
    const { error } = await supabase.from("rfid_scans").insert({
      child_id: childId, user_id: user.id, location,
    } as never);
    if (error) { toast.error("Scan failed: " + error.message); return false; }
    return true;
  };

  const simulateRfidScan = async (child: any) => {
    if (!child.rfid) {
      toast.error("This child has no RFID tag. Click ✎ to assign one.");
      return;
    }
    await insertScan(child.id, scanLocation);
  };

  // ---- Auto-scan: random scans during school hours (8AM–3PM) ----
  useEffect(() => {
    if (!autoScan) {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
      return;
    }
    const tick = async () => {
      const eligible = children.filter((c) => c.rfid && !isScannedToday(c.id));
      const hour = new Date().getHours();
      if (eligible.length && hour >= 8 && hour < 15) {
        const child = eligible[Math.floor(Math.random() * eligible.length)];
        const loc = schedule[child.id]?.location || SCAN_LOCATIONS[Math.floor(Math.random() * 3)];
        await insertScan(child.id, loc);
      }
      // next tick: 8–20 seconds (demo speed)
      autoTimer.current = window.setTimeout(tick, 8000 + Math.random() * 12000);
    };
    autoTimer.current = window.setTimeout(tick, 3000);
    return () => { if (autoTimer.current) window.clearTimeout(autoTimer.current); };
  }, [autoScan, children, latestScanPerChild, schedule]);

  // ---- Missed-scan alerts: check every 60s ----
  useEffect(() => {
    const check = () => {
      const now = new Date();
      for (const child of children) {
        const sch = schedule[child.id];
        if (!sch) continue;
        const [h, m] = sch.expectedTime.split(":").map(Number);
        const expected = new Date(); expected.setHours(h, m, 0, 0);
        // 15 min grace period
        const overdue = now.getTime() - expected.getTime() > 15 * 60 * 1000;
        const key = `${child.id}-${todayKey}`;
        if (overdue && !isScannedToday(child.id) && !missedAlerted.current.has(key)) {
          missedAlerted.current.add(key);
          toast.warning(`⚠️ ${child.name} hasn't reached ${sch.location} yet (expected ${sch.expectedTime})`, {
            duration: 12000,
          });
        }
      }
    };
    check();
    const id = window.setInterval(check, 60000);
    return () => window.clearInterval(id);
  }, [children, schedule, latestScanPerChild]);

  // ---- Edit RFID ----
  const openEdit = (child: any) => {
    setEditChild(child);
    setEditRfid(child.rfid || "");
  };
  const saveRfid = async () => {
    if (editRfid && !/^\d{8}$/.test(editRfid)) {
      toast.error("RFID must be exactly 8 digits");
      return;
    }
    setSavingRfid(true);
    const { error } = await supabase
      .from("children")
      .update({ rfid: editRfid || null } as never)
      .eq("id", editChild.id);
    setSavingRfid(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success(`RFID updated for ${editChild.name}`);
    setEditChild(null);
    fetchData();
  };

  // ---- Schedule ----
  const openSchedule = (child: any) => {
    setScheduleChild(child);
    const existing = schedule[child.id];
    setSchedLocation(existing?.location || "School");
    setSchedTime(existing?.expectedTime || "08:30");
  };
  const saveScheduleFor = () => {
    const next = { ...schedule, [scheduleChild.id]: { location: schedLocation, expectedTime: schedTime } };
    setSchedule(next); saveSchedule(next);
    toast.success(`Schedule saved: ${scheduleChild.name} → ${schedLocation} by ${schedTime}`);
    setScheduleChild(null);
  };
  const clearScheduleFor = (childId: string) => {
    const next = { ...schedule }; delete next[childId];
    setSchedule(next); saveSchedule(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">RFID Tracking</h1>
              <p className="text-sm opacity-80">Safe location-aware notifications</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* How it works */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> How RFID Works
            </CardTitle>
            <CardDescription>
              RFID is a passive radio chip — no GPS, no battery, no continuous tracking. It only "pings" when scanned at a registered location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-bold text-primary mb-1">1. Tag</div>
                <p className="text-muted-foreground">Your child wears a passive RFID card or wristband (no battery, no radiation).</p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-bold text-primary mb-1">2. Scan</div>
                <p className="text-muted-foreground">When they enter a registered location (school gate, bus), the scanner detects the tag.</p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-bold text-primary mb-1">3. Notify</div>
                <p className="text-muted-foreground">You instantly receive a notification: "Your child reached School at 8:15 AM."</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
        ) : children.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No children registered. Register a child first.</p>
              <Button className="mt-4" onClick={() => navigate("/register-child")}>Register Child</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Safe-zone status panel */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Today's Status
                </CardTitle>
                <CardDescription>Live safe-zone status for each child based on the latest scan today.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {children.map((c) => {
                    const last = latestScanPerChild[c.id];
                    const today = isScannedToday(c.id);
                    const sch = schedule[c.id];
                    return (
                      <div key={c.id} className={`p-3 rounded-lg border ${today ? "bg-primary/5 border-primary/30" : "bg-muted/30"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {today ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldAlert className="h-4 w-4 text-muted-foreground" />}
                          <p className="font-semibold text-sm">{c.name}</p>
                        </div>
                        {today ? (
                          <p className="text-xs text-foreground">
                            🟢 At <span className="font-medium">{last.location}</span> since{" "}
                            {new Date(last.scanned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">⚪ Not scanned today</p>
                        )}
                        {sch && (
                          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <AlarmClock className="h-3 w-3" /> Expected at {sch.location} by {sch.expectedTime}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Auto-scan toggle */}
            <Card className="border-primary/20">
              <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {autoScan ? <Play className="h-5 w-5 text-primary" /> : <Pause className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-semibold">Auto-scan simulation</p>
                    <p className="text-xs text-muted-foreground">
                      Generates realistic scans during school hours (8 AM – 3 PM). Demo only.
                    </p>
                  </div>
                </div>
                <Switch checked={autoScan} onCheckedChange={setAutoScan} />
              </CardContent>
            </Card>

            {/* Manual simulator */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scan className="h-5 w-5 text-primary" /> Manual Scanner Simulator
                </CardTitle>
                <CardDescription>
                  Manually trigger a scan at a chosen location. In production, real scanner hardware does this.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 max-w-sm">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <Select value={scanLocation} onValueChange={setScanLocation}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCAN_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {children.map((c, i) => {
                    const sch = schedule[c.id];
                    return (
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
                              <div className="flex-1">
                                <p className="font-semibold text-lg">{c.name}</p>
                                <p className="text-sm text-muted-foreground">Age: {c.age}</p>
                              </div>
                              {c.rfid ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Badge variant="destructive">No RFID</Badge>
                              )}
                            </div>
                            <div className="space-y-1 border-t pt-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span><span className="text-muted-foreground">RFID Tag:</span> <span className="font-mono font-medium">{c.rfid || "Not assigned"}</span></span>
                                <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-7 px-2">
                                  <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                              </div>
                              <p><span className="text-muted-foreground">Parent Email:</span> {profile?.email}</p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-muted-foreground text-xs">
                                  {sch ? `📅 ${sch.location} by ${sch.expectedTime}` : "📅 No schedule set"}
                                </span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => openSchedule(c)} className="h-7 px-2">
                                    <AlarmClock className="h-3 w-3 mr-1" /> {sch ? "Edit" : "Set"}
                                  </Button>
                                  {sch && (
                                    <Button size="sm" variant="ghost" onClick={() => clearScheduleFor(c.id)} className="h-7 px-2 text-destructive">
                                      Clear
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={c.rfid ? "default" : "outline"}
                              className="w-full"
                              onClick={() => simulateRfidScan(c)}
                              disabled={!c.rfid}
                            >
                              <Scan className="h-4 w-4 mr-1" /> Simulate Scan at {scanLocation}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Scan history */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Recent Scan History ({rfidScans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rfidScans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No scans yet. Try the simulator above.</p>
                ) : (
                  <div className="space-y-2">
                    {rfidScans.slice(0, 15).map((scan) => {
                      const child = children.find((c) => c.id === scan.child_id);
                      return (
                        <div key={scan.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-sm border">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{child?.name || "Child"} reached {scan.location}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {scan.location} · {new Date(scan.scanned_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">Safe</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Edit RFID dialog */}
      <Dialog open={!!editChild} onOpenChange={(o) => !o && setEditChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign / Update RFID</DialogTitle>
            <DialogDescription>
              Enter the 8-digit RFID tag number for <span className="font-semibold">{editChild?.name}</span>. Leave empty to remove.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>RFID (8 digits)</Label>
            <Input
              value={editRfid}
              onChange={(e) => setEditRfid(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="12345678"
              maxLength={8}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChild(null)}>Cancel</Button>
            <Button onClick={saveRfid} disabled={savingRfid}>{savingRfid ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={!!scheduleChild} onOpenChange={(o) => !o && setScheduleChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expected Arrival Schedule</DialogTitle>
            <DialogDescription>
              You'll get a warning if <span className="font-semibold">{scheduleChild?.name}</span> hasn't been scanned 15 minutes after the expected time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Location</Label>
              <Select value={schedLocation} onValueChange={setSchedLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCAN_LOCATIONS.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Expected by</Label>
              <Input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleChild(null)}>Cancel</Button>
            <Button onClick={saveScheduleFor}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RfidPage;
