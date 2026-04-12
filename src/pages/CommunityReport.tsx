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
import { ArrowLeft, Users } from "lucide-react";
import OtpVerification from "@/components/OtpVerification";
import LanguageSelector from "@/components/LanguageSelector";

const CommunityReport = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [form, setForm] = useState({
    childName: "",
    type: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    if (user) {
      supabase.from("children").select("id, name").eq("user_id", user.id).then(({ data }) => setChildren(data || []));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) { toast.error("Please verify OTP first"); return; }
    if (!form.childName || !form.type || !form.description || !form.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        user_id: user!.id,
        type: form.type,
        description: `[${form.childName}] ${form.description}`,
        location: form.location,
      });
      if (error) throw error;
      toast.success("📢 Report submitted! All users have been notified.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
            </Button>
            <LanguageSelector />
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl text-primary">{t("community.title")}</CardTitle>
              <CardDescription>{t("community.reportMissing")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <OtpVerification onVerified={() => setOtpVerified(true)} phone={profile?.phone} />

            <div className="space-y-2">
              <Label>{t("panic.childName")} *</Label>
              <Select value={form.childName} onValueChange={(v) => setForm({ ...form, childName: v })}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("community.reportType")} *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing">{t("community.reportMissing")}</SelectItem>
                  <SelectItem value="found">{t("community.reportFound")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("community.details")} *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Provide details about the child, last seen wearing, etc..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.location")} *</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Near Central Park, Gate 3" />
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

export default CommunityReport;
