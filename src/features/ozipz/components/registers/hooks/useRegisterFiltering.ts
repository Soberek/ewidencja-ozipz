import { useMemo, useCallback } from "react";
import type { OfficialRegisterKey, OzipzAction } from "../../../types/ozipz.types";

interface UseRegisterFilteringParams {
  allRegisterActions: Record<OfficialRegisterKey, OzipzAction[]>;
  year: string;
  month: string;
  jrwa: string;
  educator: string;
  search: string;
}

export function useRegisterFiltering({
  allRegisterActions,
  year,
  month,
  jrwa,
  educator,
  search,
}: UseRegisterFilteringParams) {
  const filterActions = useCallback(
    (actionList: OzipzAction[]) => {
      return actionList.filter((a) => {
        // 1. Rok
        if (year) {
          const actionYear = a.date ? a.date.slice(0, 4) : "";
          if (actionYear !== year) return false;
        }

        // 2. Miesiąc
        if (month) {
          const actionMonth = a.date ? String(parseInt(a.date.slice(5, 7), 10)) : "";
          if (actionMonth !== month) return false;
        }

        // 3. JRWA
        if (jrwa) {
          const mJrwa = (a.jrwaSign || a.jrwaCaseId || "").toLowerCase();
          const qJrwa = jrwa.toLowerCase();
          if (!mJrwa.includes(qJrwa)) return false;
        }

        // 4. Edukator / Osoba odpowiedzialna
        if (educator) {
          if ((a.leadEducator || "").trim() !== educator.trim()) return false;
        }

        // 5. Szukaj
        if (search.trim()) {
          const q = search.toLowerCase();
          const mTitle = (a.title || "").toLowerCase().includes(q);
          const mTopic = (a.topic || "").toLowerCase().includes(q);
          const mFac = (a.facilityName || "").toLowerCase().includes(q);
          const mMuni = (a.municipality || "").toLowerCase().includes(q);
          const mIzrz = (a.izrzSign || "").toLowerCase().includes(q);
          const mJrwa = (a.jrwaSign || a.jrwaCaseId || "").toLowerCase();
          const mNotes = (a.notes || "").toLowerCase().includes(q);
          const mPerson = (a.leadEducator || "").toLowerCase().includes(q);

          if (!mTitle && !mTopic && !mFac && !mMuni && !mIzrz && !mJrwa && !mNotes && !mPerson) {
            return false;
          }
        }

        return true;
      });
    },
    [year, month, jrwa, educator, search]
  );

  const filteredInformacje = useMemo(
    () => filterActions(allRegisterActions.informacje),
    [filterActions, allRegisterActions.informacje]
  );

  const filteredPublikacje = useMemo(
    () => filterActions(allRegisterActions.publikacje),
    [filterActions, allRegisterActions.publikacje]
  );

  const filteredWizytacje = useMemo(
    () => filterActions(allRegisterActions.wizytacje),
    [filterActions, allRegisterActions.wizytacje]
  );

  const isFiltered = Boolean(year || month || jrwa || educator || search.trim());

  return {
    filteredInformacje,
    filteredPublikacje,
    filteredWizytacje,
    isFiltered,
  };
}
