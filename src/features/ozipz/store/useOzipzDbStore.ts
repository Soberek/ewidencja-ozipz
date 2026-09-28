import { create } from "zustand";
import type { OzipzDbState } from "./slices/types";
import { createCoreSlice } from "./slices/core.slice";
import { createActionsSlice } from "./slices/actions.slice";
import { createProgramsSlice } from "./slices/programs.slice";
import { createFacilitiesSlice } from "./slices/facilities.slice";
import { createScheduleSlice } from "./slices/schedule.slice";
import { createMaterialsSlice } from "./slices/materials.slice";
import { createJrwaSlice } from "./slices/jrwa.slice";
import { createDictionariesSlice } from "./slices/dictionaries.slice";
import { createLettersSlice } from "./slices/letters.slice";
import { createScansSlice } from "./slices/scans.slice";
import { createStaffSlice } from "./slices/staff.slice";
import { createContactsSlice } from "./slices/contacts.slice";
import { createRegistersSlice } from "./slices/registers.slice";
import { createTemplatesSlice } from "./slices/templates.slice";
import { createPublicationsSlice } from "./slices/publications.slice";

export const useOzipzDbStore = create<OzipzDbState>()((...args) => ({
  ...createCoreSlice(...args),
  ...createActionsSlice(...args),
  ...createProgramsSlice(...args),
  ...createFacilitiesSlice(...args),
  ...createScheduleSlice(...args),
  ...createMaterialsSlice(...args),
  ...createJrwaSlice(...args),
  ...createDictionariesSlice(...args),
  ...createLettersSlice(...args),
  ...createScansSlice(...args),
  ...createStaffSlice(...args),
  ...createContactsSlice(...args),
  ...createRegistersSlice(...args),
  ...createTemplatesSlice(...args),
  ...createPublicationsSlice(...args),
}));

export type { OzipzDbState } from "./slices/types";
export * from "./domainHooks";
