import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Shield } from "lucide-react";

interface EmergencyContactsProps {
  guardianPhone?: string;
}

const EmergencyContacts = ({ guardianPhone }: EmergencyContactsProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => window.open("tel:100")}
        className="gap-1"
      >
        <Shield className="h-4 w-4" />
        {t("common.callPolice")}
      </Button>
      {guardianPhone && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`tel:${guardianPhone}`)}
          className="gap-1"
        >
          <Phone className="h-4 w-4" />
          {t("common.callGuardian")}
        </Button>
      )}
    </div>
  );
};

export default EmergencyContacts;
