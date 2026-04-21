import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Baby, Users, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const TitlePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Radio, label: "RFID Tracking" },
    { icon: ShieldCheck, label: "Smart ID" },
    { icon: Baby, label: "Panic Alerts" },
    { icon: Users, label: "Community Awareness" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 overflow-hidden relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector className="[&_button]:text-primary-foreground [&_svg]:text-primary-foreground" />
      </div>
      <motion.div
        className="text-center space-y-8 max-w-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <ShieldCheck className="h-24 w-24 text-primary-foreground opacity-90" />
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Missing Child
        </motion.h1>
        
        <motion.p
          className="text-xl md:text-2xl text-primary-foreground/80 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          A Social Problem
        </motion.p>

        <motion.p
          className="text-primary-foreground/60 text-sm max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          A community-driven platform for child safety using RFID tracking, Smart ID identification, Panic Alerts, and Community Awareness reporting.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              className="flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.1 }}
            >
              <f.icon className="h-4 w-4 text-primary-foreground/70" />
              <span className="text-xs text-primary-foreground/70">{f.label}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 font-semibold hover:scale-105 transition-transform"
            onClick={() => navigate("/login")}
          >
            Get Started
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TitlePage;
