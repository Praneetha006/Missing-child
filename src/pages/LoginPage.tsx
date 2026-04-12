import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("Email not registered or password is incorrect");
        } else {
          toast.error(error.message);
        }
        return;
      }

      const userId = authData.user?.id;
      if (userId) {
        // Check if admin
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" } as never);
        if (isAdmin) {
          toast.success("Welcome, Admin!");
          navigate("/admin");
          return;
        }

        // Get profile role for redirect
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
        if (profile?.role === "volunteer") {
          toast.success("Login successful!");
          navigate("/about");
          return;
        }
      }

      toast.success("Login successful!");
      navigate("/about");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl text-primary">{t("login.title")}</CardTitle>
          <CardDescription>Log in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{t("common.password")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("login.noAccount")} <Link to="/register" className="text-primary underline">{t("login.register")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
