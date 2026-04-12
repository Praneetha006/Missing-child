import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface OtpVerificationProps {
  onVerified: () => void;
  phone?: string;
}

const OtpVerification = ({ onVerified, phone }: OtpVerificationProps) => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setSent(true);
    setCountdown(30);
    toast.success(`📱 OTP sent: ${code} (simulated)`);
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const verify = () => {
    if (otp === generatedOtp) {
      toast.success("✅ OTP verified successfully!");
      onVerified();
    } else {
      toast.error("❌ Invalid OTP. Please try again.");
    }
  };

  if (!sent) {
    return (
      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <Label className="font-medium">{t("otp.title")}</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {phone ? `${t("otp.sent")}: ***${phone.slice(-4)}` : t("otp.sent")}
        </p>
        <Button type="button" onClick={sendOtp} size="sm">
          Send OTP
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <Label className="font-medium">{t("otp.title")}</Label>
      </div>
      <Input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={t("otp.enter")}
        maxLength={6}
        className="font-mono text-center text-lg tracking-widest"
      />
      <div className="flex gap-2">
        <Button type="button" onClick={verify} size="sm" disabled={otp.length !== 6}>
          {t("otp.verify")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={sendOtp}
          disabled={countdown > 0}
        >
          {countdown > 0 ? `${t("otp.resend")} (${countdown}s)` : t("otp.resend")}
        </Button>
      </div>
    </div>
  );
};

export default OtpVerification;
