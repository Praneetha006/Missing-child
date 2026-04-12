import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Shield, Heart } from "lucide-react";
import { motion } from "framer-motion";

const AboutPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [responsible, setResponsible] = useState(false);
  const [noMisuse, setNoMisuse] = useState(false);

  const sections = [
    { icon: AlertTriangle, title: "The Seriousness", desc: "Every year, thousands of children go missing worldwide. Quick identification and community awareness can make the difference between a safe return and prolonged separation." },
    { icon: Shield, title: "Safe Identification", desc: "Our platform uses Smart ID and Passive RFID concepts for safe identification — no continuous GPS tracking, no surveillance. Only ethical, privacy-respecting technology." },
    { icon: Users, title: "Community Awareness", desc: "Community cooperation is the backbone of child safety. By working together — parents, teachers, and volunteers — we can create a safer environment for every child." },
    { icon: Heart, title: "Ethical Technology", desc: "We believe technology should protect, not invade. No high-radiation devices, no continuous monitoring. Just responsible tools for identification and emergency response." },
  ];

  const handleContinue = () => {
    if (profile?.role === "volunteer") {
      navigate("/volunteer");
    } else {
      navigate("/child-check");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <motion.div className="text-center space-y-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Purpose of This Application</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This application helps prevent and respond to missing child cases using smart identification and emergency alert systems.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-primary/20 h-full">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <s.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive font-semibold text-center text-lg">
                ⚠️ WARNING: Do not misuse the information in this system.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-primary/30 bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-primary text-lg">Acknowledgment</h2>
              <div className="flex items-start gap-3">
                <Checkbox id="responsible" checked={responsible} onCheckedChange={(v) => setResponsible(v === true)} />
                <label htmlFor="responsible" className="text-sm cursor-pointer">
                  I understand the importance of responsible usage of this platform
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="noMisuse" checked={noMisuse} onCheckedChange={(v) => setNoMisuse(v === true)} />
                <label htmlFor="noMisuse" className="text-sm cursor-pointer">
                  I agree not to misuse any data provided through this system
                </label>
              </div>
              <Button className="w-full" disabled={!responsible || !noMisuse} onClick={handleContinue}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
