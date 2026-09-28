import { User, Building2, Sparkles, Clock, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SearchableSelect } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { OzipzProgram, OzipzFacility, OzipzStaff } from "../../../types/ozipz.types";

export interface JrwaGeneralFieldsCardProps {
  title: string;
  onTitleChange: (val: string) => void;
  notes?: string;
  onNotesChange: (val: string) => void;
  assignedEducator?: string;
  onAssignedEducatorChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  programId?: string;
  onProgramChange: (val: string) => void;
  facilityId?: string;
  onFacilityChange: (val: string) => void;
  startDate?: string;
  onStartDateChange: (val: string) => void;
  endDate?: string;
  onEndDateChange: (val: string) => void;
  programs: OzipzProgram[];
  facilities: OzipzFacility[];
  staff: OzipzStaff[];
  isReadOnly?: boolean;
}

export function JrwaGeneralFieldsCard({
  title,
  onTitleChange,
  notes,
  onNotesChange,
  assignedEducator,
  onAssignedEducatorChange,
  status,
  onStatusChange,
  programId,
  onProgramChange,
  facilityId,
  onFacilityChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  programs,
  facilities,
  staff,
  isReadOnly,
}: JrwaGeneralFieldsCardProps) {
  return (
    <div className="space-y-3">
      {/* Tytuł sprawy */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground">
          Tytuł / Przedmiot Sprawy: <span className="text-red-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={isReadOnly}
          placeholder="np. Realizacja programu Bieg po zdrowie w roku szkolnym 2025/2026"
          className="text-xs h-9"
          required
        />
      </div>

      {/* Opis merytoryczny / uwagi */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          Opis merytoryczny / Zakres teczki / Uwagi:
        </label>
        <textarea
          value={notes || ""}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={isReadOnly}
          placeholder="Szczegółowy opis zawartości teczki, korespondencji lub harmonogramu..."
          rows={2}
          className="w-full rounded-[3px] border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Prowadzący i Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1">
            <User className="size-3.5 text-muted-foreground" />
            <span>Pracownik Prowadzący:</span>
          </label>
          <Select
            value={assignedEducator || ""}
            onChange={onAssignedEducatorChange}
            disabled={isReadOnly}
            options={staff.map((s) => ({
              value: s.fullName,
              label: s.fullName,
              description: s.role,
              icon: User,
            }))}
            placeholder="-- Wybierz pracownika --"
            searchPlaceholder="Szukaj pracownika..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Status Sprawy:</span>
          </label>
          <Select
            value={status}
            onChange={onStatusChange}
            disabled={isReadOnly}
            options={[
              { value: "w_toku", label: "W toku", badge: "W toku", badgeVariant: "warning" },
              { value: "zakonczona", label: "Zakończona", badge: "Koniec", badgeVariant: "success" },
              { value: "zarchiwizowana", label: "Zarchiwizowana", badge: "Archiwum", badgeVariant: "secondary" },
            ]}
            placeholder="-- Wybierz status --"
            searchable={false}
            size="sm"
          />
        </div>
      </div>

      {/* Powiązanie z programem i placówką */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="font-medium text-foreground flex items-center gap-1">
            <Sparkles className="size-3.5 text-purple-600" />
            <span>Powiązany Program (opcjonalnie):</span>
          </label>
          <SearchableSelect
            value={programId || ""}
            onChange={onProgramChange}
            disabled={isReadOnly}
            options={programs.map((p) => ({
              value: p.id,
              label: p.name,
              description: `Edycja: ${p.editionYear || "ciągła"}`,
              badge: p.jrwaSymbol || undefined,
            }))}
            placeholder="-- Brak powiązania programowego --"
            searchPlaceholder="Szukaj programu..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium text-foreground flex items-center gap-1">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span>Powiązana Placówka (opcjonalnie):</span>
          </label>
          <SearchableSelect
            value={facilityId || ""}
            onChange={onFacilityChange}
            disabled={isReadOnly}
            options={facilities.map((f) => ({
              value: f.id,
              label: f.name,
              description: `${f.address}, ${f.city}`,
              group: f.municipality
                ? f.municipality.toLowerCase().startsWith("gmina")
                  ? f.municipality
                  : `Gmina ${f.municipality}`
                : "Inne",
              icon: Building2,
            }))}
            placeholder="-- Brak powiązania z placówką --"
            searchPlaceholder="Szukaj szkoły..."
            size="sm"
            clearable
          />
        </div>
      </div>

      {/* Daty wszczęcia i zakończenia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="font-medium text-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>Data wszczęcia sprawy:</span>
          </label>
          <DatePicker
            value={startDate || ""}
            onChange={onStartDateChange}
            disabled={isReadOnly}
            placeholder="Wybierz datę wszczęcia..."
            size="md"
            allowClear
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium text-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>Data zakończenia sprawy:</span>
          </label>
          <DatePicker
            value={endDate || ""}
            onChange={onEndDateChange}
            disabled={isReadOnly}
            placeholder="Wybierz datę zakończenia..."
            size="md"
            allowClear
          />
        </div>
      </div>
    </div>
  );
}
