import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const RegisterChild = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    rfid: "",
    smartId: "",
    emergencyContact1: "",
    emergencyContact2: "",
    address: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    if (!form.name || !form.age || !form.gender || !form.emergencyContact1 || !form.address) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (form.rfid && !/^\d{8}$/.test(form.rfid)) {
      toast.error("RFID must be exactly 8 digits");
      return false;
    }
    if (!/^\d{10}$/.test(form.emergencyContact1)) {
      toast.error("Emergency Contact 1 must be 10 digits");
      return false;
    }
    if (form.emergencyContact2 && !/^\d{10}$/.test(form.emergencyContact2)) {
      toast.error("Emergency Contact 2 must be 10 digits");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let photoUrl: string | null = null;

    // Upload photo if selected
    if (photoFile && user) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("child-photos")
        .upload(path, photoFile);
      if (uploadError) {
        toast.error("Failed to upload photo");
        return;
      }
      const { data: urlData } = supabase.storage.from("child-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }

    // Store child data in session and proceed to parent verification
    sessionStorage.setItem(
      "pendingChild",
      JSON.stringify({ ...form, userId: user?.id, photoUrl })
    );
    navigate("/parent-verification");
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-fit mb-2" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <CardTitle className="text-2xl text-primary">Register a Child</CardTitle>
            <CardDescription>Data used only for safe identification — not for tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden bg-muted">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Child" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">
                    {photoPreview ? "Change Photo" : "Upload Child Photo"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </motion.div>

              <div className="space-y-2">
                <Label>Child Name *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Child's full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 8" min={0} max={17} />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RFID (8 digits)</Label>
                  <Input value={form.rfid} onChange={(e) => set("rfid", e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="12345678" maxLength={8} />
                </div>
                <div className="space-y-2">
                  <Label>Smart ID</Label>
                  <Input value={form.smartId} onChange={(e) => set("smartId", e.target.value)} placeholder="Smart ID" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact 1 * (10 digits)</Label>
                <Input value={form.emergencyContact1} onChange={(e) => set("emergencyContact1", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact 2 (10 digits)</Label>
                <Input value={form.emergencyContact2} onChange={(e) => set("emergencyContact2", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} />
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Child's address" />
              </div>
              <Button type="submit" className="w-full hover:scale-[1.02] transition-transform">
                Proceed to Parent Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterChild;
