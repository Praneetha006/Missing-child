import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const ParentVerification = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [aadhar, setAadhar] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem("pendingChild");
    if (!pending) {
      toast.error("No child registration pending");
      navigate("/register-child");
    }
  }, [navigate]);

  const sendOtp = () => {
    if (!/^\d{12}$/.test(aadhar)) {
      toast.error("Enter valid 12-digit Aadhar");
      return;
    }
    // Check if Aadhar matches the one registered
    if (profile?.aadhar && aadhar !== profile.aadhar) {
      toast.error("Aadhar does not match your registered Aadhar");
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    toast.success(`Simulated OTP sent to your phone: ${code}`);
  };

  const handleVerify = async () => {
    if (otp !== generatedOtp) {
      toast.error("Invalid OTP");
      return;
    }
    setLoading(true);
    try {
      const pendingData = JSON.parse(sessionStorage.getItem("pendingChild") || "{}");
      const childId = `CHILD-${Date.now()}`;

      const { error } = await supabase.from("children").insert({
        user_id: user!.id,
        name: pendingData.name,
        age: parseInt(pendingData.age),
        gender: pendingData.gender,
        child_id: childId,
        smart_id: pendingData.smartId || null,
        rfid: pendingData.rfid || null,
        emergency_contact: pendingData.emergencyContact1,
        emergency_contact_2: pendingData.emergencyContact2 || null,
        address: pendingData.address || null,
        photo_url: pendingData.photoUrl || null,
      });
      if (error) throw error;

      // Mark user as verified parent
      await supabase.from("profiles").update({ verified: true, has_children: true }).eq("id", user!.id);

      sessionStorage.removeItem("pendingChild");
      toast.success("Child registered & parent verified!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl text-primary">Parent Verification</CardTitle>
          <CardDescription>Verify your identity before registering a child.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Aadhar Number (12 digits)</Label>
            <Input
              value={aadhar}
              onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="123456789012"
              maxLength={12}
            />
          </div>
          {!otpSent ? (
            <Button className="w-full" onClick={sendOtp}>
              Send OTP to Registered Phone
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  (Simulated OTP — shown in the success message above)
                </p>
              </div>
              <Button className="w-full" onClick={handleVerify} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Register Child"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentVerification;
