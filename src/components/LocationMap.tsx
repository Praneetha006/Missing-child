import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin } from "lucide-react";

interface LocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  className?: string;
}

const LocationMap = ({ latitude, longitude, address, className = "" }: LocationMapProps) => {
  const { t } = useLanguage();

  if (!latitude && !longitude && !address) return null;

  const mapUrl = latitude && longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  const linkUrl = latitude && longitude
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
    : null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm font-medium">
        <MapPin className="h-4 w-4 text-primary" />
        <span>{t("map.lastSeen")}</span>
      </div>
      {address && <p className="text-sm text-muted-foreground">{address}</p>}
      {mapUrl && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            src={mapUrl}
            width="100%"
            height="200"
            style={{ border: 0 }}
            loading="lazy"
            title="Location Map"
          />
        </div>
      )}
      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" /> {t("map.viewOnMap")}
        </a>
      )}
    </div>
  );
};

export default LocationMap;
