import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import LocationMap from "@/components/LocationMap";
import LanguageSelector from "@/components/LanguageSelector";

const PanicAlert = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [locationText, setLocationText] = useState("");
  const [message, setMessage] = useState("");
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("children").select("id, name").eq("user_id", user.id).then(({ data }) => setChildren(data || []));
    }
    getLocation();
  }, [user]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch {}
        setGeoLocation({ lat: latitude, lng: longitude, address });
        setLocationText(address);
        setGettingLocation(false);
      },
      () => { setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !locationText.trim()) {
      toast.error("Please select a child and provide location");
      return;
    }
    const child = children.find((c) => c.id === selectedChild);
    setLoading(true);
    try {
      const insertData: Record<string, unknown> = {
        user_id: user!.id,
        message: message.trim() || `PANIC ALERT: ${child?.name} - Emergency at ${locationText}`,
        location_address: locationText,
      };
      if (geoLocation) {
        insertData.latitude = geoLocation.lat;
        insertData.longitude = geoLocation.lng;
      }
      const { error } = await supabase.from("alerts").insert(insertData as never);
      if (error) throw error;
      toast.success("🚨 Emergency alert submitted! All users have been notified.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div className="w-full max-w-lg" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
              </Button>
              <LanguageSelector />
            </div>
            <div className="flex items-center gap-3">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl text-destructive">{t("panic.title")}</CardTitle>
                <CardDescription>Submit an emergency alert for your child</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("panic.childName")} *</Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="text-sm">
                  {gettingLocation ? (
                    <span className="text-muted-foreground">{t("common.loading")}</span>
                  ) : geoLocation ? (
                    <span className="text-foreground">📍 Auto-detected location</span>
                  ) : (
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={getLocation}>
                      {t("panic.detectLocation")}
                    </Button>
                  )}
                </div>
              </div>

              {geoLocation && (
                <LocationMap latitude={geoLocation.lat} longitude={geoLocation.lng} address={geoLocation.address} />
              )}

              <div className="space-y-2">
                <Label>{t("panic.location")} *</Label>
                <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="e.g. Near Central Park, Gate 3" />
              </div>

              <div className="space-y-2">
                <Label>{t("panic.additionalDetails")}</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the emergency situation..." rows={3} />
              </div>

              <Button type="submit" variant="destructive" className="w-full" disabled={loading}>
                {loading ? t("common.submitting") : `🚨 ${t("panic.submit")}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PanicAlert;
