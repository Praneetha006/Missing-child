import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    role: "",
    age: "",
    gender: "",
    phone: "",
    aadhar: "",
    address: "",
    email: "",
    password: "",
  });

  const validate = () => {
    if (!form.fullName || !form.role || !form.age || !form.gender || !form.phone || !form.aadhar || !form.address || !form.email || !form.password) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (!/^\d{2}$/.test(form.age)) {
      toast.error("Age must be exactly 2 digits");
      return false;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Phone must be exactly 10 digits");
      return false;
    }
    if (!/^\d{12}$/.test(form.aadhar)) {
      toast.error("Aadhar must be exactly 12 digits");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let userId: string | undefined;
      let isReRegistration = false;

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) {
        // Email already exists — likely a previously rejected user trying to re-apply.
        if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (signInError) {
            toast.error("This email is already registered. Use the same password you registered with, or use a different email.");
            return;
          }
          userId = signInData.user?.id;
          isReRegistration = true;
        } else {
          throw error;
        }
      } else {
        userId = data.user?.id;
      }

      if (userId) {
        // Upsert profile so re-registration after rejection resets status to pending.
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          age: parseInt(form.age),
          gender: form.gender,
          aadhar: form.aadhar,
          address: form.address,
          has_children: false,
          guardian_declaration: true,
          status: "pending",
          verified: false,
        });
        if (profileError) throw profileError;
      }

      // If we signed in to re-register, sign out so admin can review again.
      if (isReRegistration) {
        await supabase.auth.signOut();
      }

      toast.success(
        isReRegistration
          ? "✅ Re-registration submitted! Please wait for admin approval before logging in."
          : "Registration successful! Please check your email to verify, then log in."
      );
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Registration</CardTitle>
          <CardDescription>Join the child safety community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Register As *</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent (to protect and track your child)</SelectItem>
                  <SelectItem value="volunteer">Volunteer (to help find missing children)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age * (2 digits)</Label>
                <Input value={form.age} onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="35" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone * (10 digits)</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} />
            </div>
            <div className="space-y-2">
              <Label>Aadhar Number * (12 digits)</Label>
              <Input value={form.aadhar} onChange={(e) => set("aadhar", e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="123456789012" maxLength={12} />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full address" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password * (min 6 chars)</Label>
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary underline">Back to Login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
