import { useState } from "react";
import type { OzipzAction } from "../../types/ozipz.types";
import type { ReportAnnexRow } from "../../utils/reportAnnex";
import { downloadAnnexReportExcel } from "../../utils/reportAnnex";
import { downloadHealthPromotionReportWorkbook } from "../../utils/reportExport";

interface UseReportExportsParams {
  filteredActions: OzipzAction[];
  annexRows: ReportAnnexRow[];
  year: number;
  months: number[];
  preparedPersonId: string;
  defaultPersonName: string;
}

export function useReportExports({
  filteredActions,
  annexRows,
  year,
  months,
  preparedPersonId,
  defaultPersonName,
}: UseReportExportsParams) {
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState<"xlsx" | "annex-1" | "annex-2" | null>(null);

  const handleExportXlsx = async () => {
    setExportError(null);
    setExportSuccess(null);
    setExportPending("xlsx");
    try {
      await downloadHealthPromotionReportWorkbook(
        filteredActions,
        year,
        months,
        preparedPersonId || defaultPersonName
      );
      setExportSuccess("Pobrano arkusz sprawozdania .xlsx");
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Błąd eksportu");
    } finally {
      setExportPending(null);
    }
  };

  const handleExportAnnex = async (variant: 1 | 2) => {
    setExportError(null);
    setExportSuccess(null);
    setExportPending(variant === 1 ? "annex-1" : "annex-2");
    try {
      await downloadAnnexReportExcel(
        annexRows,
        variant,
        year,
        months,
        preparedPersonId || defaultPersonName
      );
      setExportSuccess(`Pobrano Załącznik nr ${variant} (.xlsx)`);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Błąd eksportu załącznika");
    } finally {
      setExportPending(null);
    }
  };

  return {
    exportError,
    exportSuccess,
    exportPending,
    handleExportXlsx,
    handleExportAnnex,
  };
}
