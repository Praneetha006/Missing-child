import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  genderFilter: string;
  onGenderChange: (g: string) => void;
  sortOrder: string;
  onSortChange: (s: string) => void;
  ageMin?: string;
  onAgeMinChange?: (a: string) => void;
  ageMax?: string;
  onAgeMaxChange?: (a: string) => void;
  locationFilter?: string;
  onLocationChange?: (l: string) => void;
}

const SearchFilters = ({
  searchQuery, onSearchChange,
  genderFilter, onGenderChange,
  sortOrder, onSortChange,
  ageMin = "", onAgeMinChange,
  ageMax = "", onAgeMaxChange,
  locationFilter = "", onLocationChange,
}: SearchFiltersProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[180px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("common.search")}
            className="pl-8 h-9"
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {onAgeMinChange && (
          <Input
            type="number"
            placeholder="Min Age"
            value={ageMin}
            onChange={(e) => onAgeMinChange(e.target.value)}
            className="w-20 h-9"
            min={0}
            max={17}
          />
        )}
        {onAgeMaxChange && (
          <Input
            type="number"
            placeholder="Max Age"
            value={ageMax}
            onChange={(e) => onAgeMaxChange(e.target.value)}
            className="w-20 h-9"
            min={0}
            max={17}
          />
        )}
        <Select value={genderFilter} onValueChange={onGenderChange}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder={t("common.gender")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="Male">{t("common.male")}</SelectItem>
            <SelectItem value="Female">{t("common.female")}</SelectItem>
            <SelectItem value="Other">{t("common.other")}</SelectItem>
          </SelectContent>
        </Select>
        {onLocationChange && (
          <Input
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder={t("common.location")}
            className="w-32 h-9"
          />
        )}
        <Select value={sortOrder} onValueChange={onSortChange}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder={t("search.sortBy")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("search.newest")}</SelectItem>
            <SelectItem value="oldest">{t("search.oldest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SearchFilters;
