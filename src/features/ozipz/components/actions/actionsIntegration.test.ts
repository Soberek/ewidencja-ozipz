import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionEditorState } from "./editor/useActionEditorState";
import { getDefaultActionFormValues } from "./editor/editorUtils";
import { useAudienceGroups } from "./editor/useAudienceGroups";
import { calculateAudienceGroupBreakdown, parseAudienceEntryTokens } from "../../utils/calculators/actionDistributions";
import { Mappers } from "../../../../db/mappers";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import type { OzipzAction } from "../../types/ozipz.types";
import type { ActionSqlRow } from "../../../../db/types";
import { formatFullJrwaSign } from "../../utils/programJrwaUtils";

describe("Actions Module - Comprehensive Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Zero Default Values & Pure Initialization", () => {
    it("getDefaultActionFormValues initializes with empty status and ezdStatus", () => {
      const defaults = getDefaultActionFormValues();
      expect(defaults.status).toBe("");
      expect(defaults.ezdStatus).toBe("");
      expect(defaults.title).toBe("");
      expect(defaults.facilityId).toBe("");
      expect(defaults.programId).toBe("");
      expect(defaults.leadEducator).toBe("");
    });

    it("useAudienceGroups initializes without fictitious default groups or participants", () => {
      const { result } = renderHook(() => useAudienceGroups());
      expect(result.current.audienceGroups).toHaveLength(1);
      expect(result.current.audienceGroups[0].items).toHaveLength(1);
      expect(result.current.audienceGroups[0].items[0].name).toBe("");
      expect(result.current.audienceGroups[0].items[0].count).toBe(0);
      expect(result.current.totalDirectParticipants).toBe(0);
    });
  });

  describe("2. Media Publication Workflow & Zod Validation", () => {
    it("auto-assigns default audience group 'Społeczność lokalna / Internauci' and submits successfully for publications", async () => {
      const onSaveMock = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useActionEditorState({
          onSave: onSaveMock,
        })
      );

      // Symulujemy zmianę typu działania na publikację
      act(() => {
        result.current.setValue("actionType", "Publikacja w mediach społecznościowych");
      });

      expect(result.current.isPublication).toBe(true);

      // Zapisujemy przez onSubmit z formularza
      await act(async () => {
        await result.current.onSubmit({
          title: "Post edukacyjny o szczepieniach",
          actionType: "Publikacja w mediach społecznościowych",
          date: "2026-05-10",
          facilityName: "PSSE Myślibórz (media)",
          municipality: "Gmina Myślibórz",
          topic: "Szczepienia ochronne",
          audienceGroup: "",
          leadEducator: "Jan Kowalski",
          participantsCount: 0,
          indirectRecipientsCount: 1500,
          materialsDistributedCount: 0,
          status: "wykonane",
          ezdStatus: "nie_dotyczy",
        });
      });

      expect(onSaveMock).toHaveBeenCalledTimes(1);
      const savedAction = onSaveMock.mock.calls[0][0];
      expect(savedAction.actionType).toBe("Publikacja w mediach społecznościowych");
      expect(savedAction.audienceGroup).toBe("Społeczność lokalna / Internauci");
      expect(savedAction.indirectRecipientsCount).toBe(1500);
    });
  });

  describe("3. Audience Breakdown & Age Ranges Parsing (P0 Bug Fix)", () => {
    it("parseAudienceEntryTokens preserves age ranges like '13-14 lat' without splitting them", () => {
      const tokens = parseAudienceEntryTokens("Młodzież 13-14 lat - 25 os., Dorośli - 10 os.", 35);
      expect(tokens).toEqual([
        { group: "Młodzież 13-14 lat", count: 25 },
        { group: "Dorośli", count: 10 },
      ]);
    });

    it("calculateAudienceGroupBreakdown aggregates groups accurately preserving age ranges", () => {
      const mockActions: OzipzAction[] = [
        {
          id: "act-1",
          title: "Warsztat profilaktyczny",
          date: "2026-05-10",
          actionType: "Prelekcja",
          topic: "Zdrowie",
          municipality: "Myślibórz",
          facilityName: "SP 1",
          leadEducator: "Anna Nowak",
          ezdStatus: "w_ezd",
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          audienceGroup: "Grupa 1: Młodzież 13-14 lat - 25 os., Nauczyciele - 2 os.",
          participantsCount: 27,
          status: "wykonane",
          numberOfActions: 1,
          createdAt: "2026-05-10",
          updatedAt: "2026-05-10",
        },
      ];
      const breakdown = calculateAudienceGroupBreakdown(mockActions);
      const youthItem = breakdown.find((b) => b.group === "Młodzież 13-14 lat");
      const teacherItem = breakdown.find((b) => b.group === "Nauczyciele");

      expect(youthItem).toBeDefined();
      expect(youthItem?.directRecipients).toBe(25);
      expect(youthItem?.actionsCount).toBe(1);

      expect(teacherItem).toBeDefined();
      expect(teacherItem?.directRecipients).toBe(2);
      expect(teacherItem?.actionsCount).toBe(1);
    });
  });

  describe("4. SQLite Mapper Graceful Fallback (P1 Robustness)", () => {
    it("toAction safely parses valid SQLite rows into Action domains", () => {
      const rawRow: ActionSqlRow = {
        id: "act-1",
        title: "Warsztaty w szkole",
        date: "2026-04-12",
        action_type: "Prelekcja",
        program_id: "prog-1",
        program_name: "Czyste Powietrze",
        topic: "Ekologia",
        facility_id: "fac-1",
        facility_name: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        lead_educator: "Anna Nowak",
        status: "wykonane",
        ezd_status: "w_ezd",
        jrwa_sign: "OZiPZ.966.1.1.2026",
        izrz_sign: "IZRZ/1/2026",
        notes: "Wszystko zgodnie z planem",
        number_of_actions: 1,
        participants_count: 30,
        indirect_recipients_count: 0,
        materials_distributed_count: 0,
        audience_group: "Dzieci i młodzież",
        created_at: "2026-04-12T10:00:00Z",
        updated_at: "2026-04-12T10:00:00Z",
      };

      const action = Mappers.toAction(rawRow);
      expect(action.id).toBe("act-1");
      expect(action.title).toBe("Warsztaty w szkole");
      expect(action.participantsCount).toBe(30);
      expect(action.audienceGroup).toBe("Dzieci i młodzież");
    });

    it("toAction gracefully handles malformed or invalid SQLite rows without throwing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const corruptedRow: ActionSqlRow = {
        id: "act-corrupted",
        title: "Z", // zbyt krótki tytuł (ActionSchema wymaga min 2 znaki)
        date: "2026-04-12",
        action_type: "Prelekcja",
        program_id: null,
        program_name: null,
        facility_id: null,
        topic: "Test",
        facility_name: "SP",
        municipality: "Myślibórz",
        lead_educator: "", // wymagane pole leadEducator jest puste
        status: "wykonane",
        ezd_status: null,
        jrwa_sign: null,
        izrz_sign: null,
        notes: null,
        number_of_actions: 1,
        participants_count: -10, // ujemna liczba uczestników
        indirect_recipients_count: 0,
        materials_distributed_count: 0,
        audience_group: "Dorośli",
        created_at: "2026-04-12T10:00:00Z",
        updated_at: "2026-04-12T10:00:00Z",
      };

      const fallbackAction = Mappers.toAction(corruptedRow);
      expect(fallbackAction.id).toBe("act-corrupted");
      expect(fallbackAction.title).toBe("Z");
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("5. JRWA Formatting Integrity", () => {
    it("formatFullJrwaSign returns empty string when jrwaSign is empty or undefined", () => {
      const emptySign = formatFullJrwaSign({
        jrwaSign: "",
        date: "2026-05-15",
      });
      expect(emptySign).toBe("");

      const undefinedSign = formatFullJrwaSign({
        date: "2026-05-15",
      });
      expect(undefinedSign).toBe("");
    });

    it("formatFullJrwaSign normalizes valid existing JRWA sign correctly", () => {
      const validSign = formatFullJrwaSign({
        jrwaSign: "OZiPZ.966.1.1.2026",
        date: "2026-05-15",
      });
      expect(validSign).toBe("OZiPZ.966.1.1.2026");
    });
  });

  describe("6. Store Unlinks Distributions", () => {
    it("deleteAction preserves material distributions and clears their action link", async () => {
      const testAction: OzipzAction = {
        id: "act-cascade-test",
        title: "Działanie z materiałami",
        date: "2026-05-15",
        actionType: "Prelekcja",
        topic: "Higiena",
        facilityName: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        leadEducator: "Jan Kowalski",
        ezdStatus: "w_ezd",
        status: "wykonane",
        participantsCount: 20,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 20,
        audienceGroup: "Uczniowie",
        numberOfActions: 1,
        createdAt: "2026-05-15T10:00:00Z",
        updatedAt: "2026-05-15T10:00:00Z",
      };

      const testDistributions = [
        {
          id: "dist-1",
          materialId: "mat-1",
          materialTitle: "Ulotka Higiena",
          quantity: 20,
          recipientType: "Szkoła",
          recipientName: "SP 1",
          municipality: "Myślibórz",
          distributionDate: "2026-05-15",
          assignedEducator: "Jan Kowalski",
          purpose: "Edukacja szkolna",
          createdAt: "2026-05-15",
          actionId: "act-cascade-test",
          actionTitle: "Działanie z materiałami",
        },
        {
          id: "dist-2",
          materialId: "mat-2",
          materialTitle: "Inna Ulotka",
          quantity: 10,
          recipientType: "Inne",
          recipientName: "Odbiorca Niezwiązany",
          municipality: "Dębno",
          distributionDate: "2026-05-10",
          assignedEducator: "Anna Nowak",
          purpose: "Akcja",
          createdAt: "2026-05-10",
          actionId: "act-other",
          actionTitle: "Inne Działanie",
        },
      ];

      // Ustawiamy stan w store
      useOzipzDbStore.setState({
        actions: [testAction],
        distributions: testDistributions,
      });

      // Wywołujemy deleteAction
      await act(async () => {
        await useOzipzDbStore.getState().deleteAction("act-cascade-test");
      });

      const updatedState = useOzipzDbStore.getState();
      expect(updatedState.actions.find((a) => a.id === "act-cascade-test")).toBeUndefined();
      // Historia wydań materiałów pozostaje, ale nie wskazuje usuniętego działania.
      expect(updatedState.distributions.find((d) => d.id === "dist-1")).toMatchObject({
        materialId: "mat-1", quantity: 20, actionId: undefined, actionTitle: undefined,
      });
      // dist-2 niezwiązany z usuwaną akcją musi pozostać nienaruszony
      expect(updatedState.distributions.find((d) => d.id === "dist-2")).toBeDefined();
    });
  });
});
