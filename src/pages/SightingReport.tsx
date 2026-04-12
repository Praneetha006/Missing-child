import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Eye, MapPin, Upload } from "lucide-react";
import OtpVerification from "@/components/OtpVerification";
import LanguageSelector from "@/components/LanguageSelector";

const SightingReport = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [otpVerified, setOtpVerified] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    location: "",
    linkedReportId: "",
  });
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    supabase.from("reports").select("id, description, type").eq("type", "missing").then(({ data }) => setReports(data || []));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be < 5MB"); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) { toast.error("Please verify OTP first"); return; }
    if (!form.description || !form.location) { toast.error("Please fill all required fields"); return; }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile && user) {
        const ext = imageFile.name.split(".").pop();
        const path = `sightings/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("child-photos").upload(path, imageFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("child-photos").getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const insertData: Record<string, unknown> = {
        user_id: user!.id,
        description: form.description,
        location: form.location,
        image_url: imageUrl,
        linked_report_id: form.linkedReportId || null,
      };
      if (geoLocation) {
        insertData.latitude = geoLocation.lat;
        insertData.longitude = geoLocation.lng;
      }

      const { error } = await supabase.from("sightings").insert(insertData as never);
      if (error) throw error;
      toast.success("👁️ Sighting report submitted! Thank you for helping.");
      navigate(-1);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit sighting report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
            </Button>
            <LanguageSelector />
          </div>
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl text-primary">{t("sighting.title")}</CardTitle>
              <CardDescription>Report if you spot a missing child</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <OtpVerification onVerified={() => setOtpVerified(true)} phone={profile?.phone} />

            <div className="space-y-2">
              <Label>{t("sighting.linkCase")}</Label>
              <Select value={form.linkedReportId} onValueChange={(v) => setForm({ ...form, linkedReportId: v })}>
                <SelectTrigger><SelectValue placeholder={t("sighting.selectCase")} /></SelectTrigger>
                <SelectContent>
                  {reports.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.description.slice(0, 60)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("sighting.description")} *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you saw, clothing, direction of movement..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("common.location")} *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Near Central Park, Gate 3"
                  className="flex-1"
                />
                {geoLocation && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, location: `${geoLocation.lat.toFixed(4)}, ${geoLocation.lng.toFixed(4)}` })}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("sighting.uploadImage")}</Label>
              <div className="flex items-center gap-3">
                {imagePreview && (
                  <img src={imagePreview} alt="Sighting" className="w-16 h-16 rounded-lg object-cover border" />
                )}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{imageFile ? "Change Image" : "Choose Image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !otpVerified}>
              {loading ? t("common.submitting") : t("common.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SightingReport;
