import { describe, it, expect, vi } from "vitest";
import {
  parseAudienceItem,
  parseAudienceGroups,
  formatAudienceString,
  calculateTotalParticipants,
} from "./audienceUtils";
import {
  getDefaultActionFormValues,
  mapActionToFormValues,
  isPublicationActionType,
  isDistributionActionType,
  isNoJrwaActionType,
  duplicateActionDraft,
} from "./editorUtils";
import { ActionEditorHeader } from "./ActionEditorHeader";
import { ACTION_CARD_PRESETS } from "./presetsConfig";
import type { OzipzAction, OzipzDictionaryItem, OzipzStaff } from "../../../types/ozipz.types";

describe("Action Editor - audienceUtils", () => {
  it("parses single audience item with age range and count", () => {
    const item = parseAudienceItem("Uczniowie kl. 7 (13-14 lat) - 25");
    expect(item.name).toBe("Uczniowie kl. 7");
    expect(item.ageFrom).toBe(13);
    expect(item.ageTo).toBe(14);
    expect(item.count).toBe(25);
  });

  it("parses audience item with 60+ age format", () => {
    const item = parseAudienceItem("Seniorzy (60+ lat) - 15");
    expect(item.name).toBe("Seniorzy");
    expect(item.ageFrom).toBe(60);
    expect(item.ageTo).toBeNull();
    expect(item.count).toBe(15);
  });

  it("parses audience groups string with multiple groups separated by semicolon", () => {
    const raw = "Grupa 1: Uczniowie kl. 7 (13-14 lat) - 20, Opiekunowie - 1; Grupa 2: Uczniowie kl. 8 (14-15 lat) - 22, Opiekunowie - 1";
    const groups = parseAudienceGroups(raw);
    expect(groups.length).toBe(2);
    expect(groups[0].name).toBe("Grupa 1");
    expect(groups[0].items.length).toBe(2);
    expect(groups[0].items[0].name).toBe("Uczniowie kl. 7");
    expect(groups[0].items[0].count).toBe(20);
    expect(groups[1].name).toBe("Grupa 2");
    expect(groups[1].items[0].count).toBe(22);
  });

  it("formats audience groups back to string properly", () => {
    const groups = [
      {
        id: "g1",
        name: "Grupa 1",
        items: [
          { id: "i1", name: "Uczniowie kl. 7", count: 20, ageFrom: 13, ageTo: 14 },
          { id: "i2", name: "Opiekunowie", count: 1, ageFrom: null, ageTo: null },
        ],
      },
    ];
    const formatted = formatAudienceString(groups);
    expect(formatted).toBe("Uczniowie kl. 7 (13-14 lat) - 20, Opiekunowie - 1");
  });

  it("calculates total direct participants across all groups and items", () => {
    const groups = [
      {
        id: "g1",
        name: "Grupa 1",
        items: [
          { id: "i1", name: "Uczniowie", count: 20 },
          { id: "i2", name: "Opiekunowie", count: 2 },
        ],
      },
      {
        id: "g2",
        name: "Grupa 2",
        items: [
          { id: "i3", name: "Uczniowie", count: 25 },
        ],
      },
    ];
    const total = calculateTotalParticipants(groups);
    expect(total).toBe(47);
  });
});

describe("Action Editor - editorUtils", () => {
  const dummyDict: OzipzDictionaryItem[] = [
    {
      id: "d1",
      dictType: "activityType",
      code: "prelekcja",
      label: "Prelekcja (warsztat)",
      isSystem: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];
  const dummyStaff: OzipzStaff[] = [
    {
      id: "s1",
      fullName: "Krzysztof Palpuchowski",
      role: "Referent",
      email: "krzysztof@psse.gov.pl",
      phone: "123456789",
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  it("creates default form values correctly without fake defaults", () => {
    const defaultVals = getDefaultActionFormValues(dummyDict, dummyStaff);
    expect(defaultVals.actionType).toBe("");
    expect(defaultVals.leadEducator).toBe("Krzysztof Palpuchowski");
    expect(defaultVals.municipality).toBe("");
    expect(defaultVals.participantsCount).toBe(0);
    expect(defaultVals.audienceGroup).toBe("");
  });

  it("maps existing action to form values correctly", () => {
    const action: OzipzAction = {
      id: "act-1",
      title: "Warsztaty tytoniowe",
      actionType: "Prelekcja (warsztat)",
      date: "2026-04-15",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Barlinek",
      topic: "tyton",
      audienceGroup: "Uczestnicy",
      status: "wykonane",
      ezdStatus: "w_ezd",
      participantsCount: 30,
      materialsDistributedCount: 0,
      leadEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-04-15T10:00:00Z",
      updatedAt: "2026-04-15T10:00:00Z",
    };
    const formVals = mapActionToFormValues(action, dummyStaff);
    expect(formVals.title).toBe("Warsztaty tytoniowe");
    expect(formVals.facilityName).toBe("Szkoła Podstawowa nr 1");
    expect(formVals.municipality).toBe("Barlinek");
    expect(formVals.participantsCount).toBe(30);
  });

  it("identifies publication actions accurately to trigger EZD/IZRZ locking", () => {
    expect(isPublicationActionType("Publikacja media (Portal X)")).toBe(true);
    expect(isPublicationActionType("Publikacja media (Strona)")).toBe(true);
    expect(isPublicationActionType("Publikacja media (Facebook)")).toBe(true);
    expect(isPublicationActionType("publikacja_x")).toBe(true);
    expect(isPublicationActionType("publikacja_strona")).toBe(true);
    expect(isPublicationActionType("Prelekcja (warsztat)")).toBe(false);
    expect(isPublicationActionType("Konkurs (quiz)")).toBe(false);
    expect(isPublicationActionType("")).toBe(false);
    expect(isPublicationActionType(undefined)).toBe(false);
  });

  it("identifies distribution actions accurately to trigger EZD/IZRZ locking", () => {
    expect(isDistributionActionType("Dystrybucja")).toBe(true);
    expect(isDistributionActionType("dystrybucja")).toBe(true);
    expect(isDistributionActionType("Samoistna dystrybucja materiałów")).toBe(true);
    expect(isDistributionActionType("Prelekcja (warsztat)")).toBe(false);
    expect(isDistributionActionType("")).toBe(false);
    expect(isDistributionActionType(undefined)).toBe(false);

    expect(isNoJrwaActionType("Publikacja media (Portal X)")).toBe(true);
    expect(isNoJrwaActionType("Dystrybucja")).toBe(true);
    expect(isNoJrwaActionType("Prelekcja (warsztat)")).toBe(false);
  });
});

describe("Action Editor - presetsConfig & Unified Program/JRWA Selection", () => {
  it("contains all standard 1-click quick presets with JRWA integration", () => {
    expect(ACTION_CARD_PRESETS.length).toBeGreaterThanOrEqual(4);
    const sp1 = ACTION_CARD_PRESETS.find((p) => p.id === "preset-sp-1grp");
    expect(sp1).toBeDefined();
    expect(sp1?.jrwaSymbol).toBe("966.1");
    expect(sp1?.actionType).toBe("Prelekcja (warsztat)");
  });

  it("binds program and JRWA symbol together for school programs", () => {
    const biegPreset = ACTION_CARD_PRESETS.find((p) => p.jrwaSymbol === "966.3");
    expect(biegPreset).toBeDefined();
    expect(biegPreset?.jrwaSymbol).toBe("966.3");
  });
});

describe("Action Editor - Live Summary Footer", () => {
  it("exports valid ActionEditorFooter component contract with rich metadata support", async () => {
    const { ActionEditorFooter } = await import("./ActionEditorFooter");
    expect(ActionEditorFooter).toBeDefined();
  });

  it("renders live metadata badges and metrics in ActionEditorFooter", async () => {
    const React = await import("react");
    const { render, screen } = await import("@testing-library/react");
    const { ActionEditorFooter } = await import("./ActionEditorFooter");

    const { unmount } = render(
      React.createElement(ActionEditorFooter, {
        title: "Warsztaty Zdrowotne",
        date: "2026-09-15",
        actionType: "Prelekcja",
        facilityName: "SP 1 Myślibórz",
        municipality: "Myślibórz",
        programName: "Czyste Powietrze Wokół Nas",
        leadEducator: "Jan Kowalski",
        ezdStatus: "zarejestrowane",
        jrwaSign: "OZiPZ.966.1.1.2026",
        izrzSign: "IZRZ/2026/09/01",
        totalDirectParticipants: 45,
        materialsDistributedCount: 50,
        onCancel: vi.fn(),
      })
    );

    expect(screen.getByText("Warsztaty Zdrowotne")).toBeDefined();
    expect(screen.getByText("2026-09-15")).toBeDefined();
    expect(screen.getByText("Prelekcja")).toBeDefined();
    expect(screen.getByText(/SP 1 Myślibórz/)).toBeDefined();
    expect(screen.getByText("Czyste Powietrze Wokół Nas")).toBeDefined();
    expect(screen.getByText(/Jan Kowalski/)).toBeDefined();
    expect(screen.getByText("zarejestrowane")).toBeDefined();
    expect(screen.getByText("OZiPZ.966.1.1.2026")).toBeDefined();
    expect(screen.getByText("IZRZ/2026/09/01")).toBeDefined();

    // Metrics
    expect(screen.getByText("1 DZ")).toBeDefined();
    expect(screen.getByText("45")).toBeDefined();
    expect(screen.getByText("50")).toBeDefined();

    unmount();
  });

  it("conditionally hides empty metadata in ActionEditorFooter", async () => {
    const React = await import("react");
    const { render, screen } = await import("@testing-library/react");
    const { ActionEditorFooter } = await import("./ActionEditorFooter");

    const { unmount } = render(
      React.createElement(ActionEditorFooter, {
        totalDirectParticipants: 10,
        onCancel: vi.fn(),
      })
    );

    expect(screen.getByText("1 DZ")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.queryByText("📍")).toBeNull();
    expect(screen.queryByText("👤")).toBeNull();

    unmount();
  });

  it("renders custom numberOfActions in ActionEditorFooter", async () => {
    const React = await import("react");
    const { render, screen } = await import("@testing-library/react");
    const { ActionEditorFooter } = await import("./ActionEditorFooter");

    const { unmount } = render(
      React.createElement(ActionEditorFooter, {
        numberOfActions: 3,
        totalDirectParticipants: 60,
        onCancel: vi.fn(),
      })
    );

    expect(screen.getByText("3 DZ")).toBeDefined();
    expect(screen.getByText("60")).toBeDefined();

    unmount();
  });

  it("correctly maps partial action prefill (without id) from Dashboard", () => {
    const partialAction: Partial<OzipzAction> = {
      title: "Warsztaty z planu",
      date: "2026-09-15",
      facilityName: "SP 1 Myślibórz",
      programId: "prog-1",
      scheduleEventId: "ev-100",
    };
    const formVals = mapActionToFormValues(partialAction, []);
    expect(formVals.title).toBe("Warsztaty z planu");
    expect(formVals.date).toBe("2026-09-15");
    expect(formVals.facilityName).toBe("SP 1 Myślibórz");
    expect(formVals.programId).toBe("prog-1");
    expect(formVals.scheduleEventId).toBe("ev-100");
    expect(formVals.participantsCount).toBe(0);
    expect(formVals.actionType).toBe("");
  });
});

describe("Action Editor - Card Components & Single JRWA Sign Placement", () => {
  it("renders editable Znak Sprawy in ActionEditorKancelariaCard for regular actions and locks it for publications", async () => {
    const React = await import("react");
    const { render, screen } = await import("@testing-library/react");
    const { ActionEditorKancelariaCard } = await import("./ActionEditorKancelariaCard");

    // Case 1: Regular action (isPublication = false)
    const onJrwaSignChange = vi.fn();
    const onGenerateJrwaSign = vi.fn();

    const { unmount } = render(
      React.createElement(ActionEditorKancelariaCard, {
        date: "2026-09-03",
        selectedJrwaSymbol: "966.1",
        jrwaSign: "OZiPZ.966.1.1.2026",
        izrzSign: "1/2026",
        ezdStatus: "w_ezd",
        isPublication: false,
        onDateChange: vi.fn(),
        onJrwaSignChange: onJrwaSignChange,
        onGenerateJrwaSign: onGenerateJrwaSign,
        onIzrzSignChange: vi.fn(),
        onEzdStatusChange: vi.fn(),
      })
    );

    expect(screen.getByText("Dane kancelaryjne")).toBeDefined();
    expect(screen.getByDisplayValue("OZiPZ.966.1.1.2026")).toBeDefined();
    expect(screen.getByText("Auto-Generuj")).toBeDefined();
    expect(screen.getByText("JRWA 966.1")).toBeDefined();
    unmount();

    // Case 2: Publication action (isPublication = true)
    const { unmount: unmount2 } = render(
      React.createElement(ActionEditorKancelariaCard, {
        date: "2026-09-03",
        selectedJrwaSymbol: "966.1",
        jrwaSign: "",
        izrzSign: "",
        ezdStatus: "nie_dotyczy",
        isPublication: true,
        onDateChange: vi.fn(),
        onJrwaSignChange: onJrwaSignChange,
        onGenerateJrwaSign: onGenerateJrwaSign,
        onIzrzSignChange: vi.fn(),
        onEzdStatusChange: vi.fn(),
      })
    );

    expect(screen.getByText("Publikacja media (EZD zablokowane)")).toBeDefined();
    expect(screen.queryByText("Auto-Generuj")).toBeNull();
    expect(screen.getByText("Nie dotyczy")).toBeDefined();
    unmount2();

    // Case 3: Standalone distribution action (isDistribution = true)
    const { unmount: unmount3 } = render(
      React.createElement(ActionEditorKancelariaCard, {
        date: "2026-09-03",
        selectedJrwaSymbol: "966.1",
        jrwaSign: "",
        izrzSign: "",
        ezdStatus: "nie_dotyczy",
        isPublication: false,
        isDistribution: true,
        onDateChange: vi.fn(),
        onJrwaSignChange: onJrwaSignChange,
        onGenerateJrwaSign: onGenerateJrwaSign,
        onIzrzSignChange: vi.fn(),
        onEzdStatusChange: vi.fn(),
      })
    );

    expect(screen.getByText("Samoistna dystrybucja (EZD zablokowane)")).toBeDefined();
    expect(screen.queryByText("Auto-Generuj")).toBeNull();
    expect(screen.getByText("Nie dotyczy")).toBeDefined();
    unmount3();
  });

  it("duplicateActionDraft preserves substantive data and strips unique identifiers and EZD signs", () => {
    const sourceAction: OzipzAction = {
      id: "act-123",
      title: "Warsztaty Zdrowego Odżywiania",
      actionType: "prelekcja",
      date: "2026-05-12",
      facilityId: "fac-1",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Dębno",
      programId: "prog-1",
      programName: "Trzymaj Formę!",
      campaignId: "camp-1",
      topic: "Żywienie",
      audienceGroup: "Uczniowie kl. 5 (11-12 lat) - 30",
      participantsCount: 30,
      materialsDistributedCount: 30,
      materialId: "mat-1",
      leadEducator: "Jan Kowalski",
      notes: "Udane spotkanie z uczniami",
      status: "wykonane",
      ezdStatus: "w_ezd",
      jrwaCaseId: "case-1",
      jrwaSign: "OZiPZ.966.1.1.2026",
      izrzSign: "IZRZ.2026.12",
      sourceInfo: "EZD: 1234/2026",
      scheduleEventId: "sched-99",
      createdAt: "2026-05-12T10:00:00Z",
      updatedAt: "2026-05-12T10:00:00Z",
    };

    const draft = duplicateActionDraft(sourceAction);
    expect(draft.title).toBe(sourceAction.title);
    expect(draft.actionType).toBe(sourceAction.actionType);
    expect(draft.facilityName).toBe(sourceAction.facilityName);
    expect(draft.municipality).toBe(sourceAction.municipality);
    expect(draft.programId).toBe(sourceAction.programId);
    expect(draft.audienceGroup).toBe(sourceAction.audienceGroup);
    expect(draft.participantsCount).toBe(30);
    expect(draft.materialsDistributedCount).toBe(30);
    expect(draft.leadEducator).toBe("Jan Kowalski");
    expect(draft.status).toBe("wykonane");

    // Unikalne sygnatury usunięte / zresetowane
    expect((draft as any).id).toBeUndefined();
    expect(draft.jrwaSign).toBeUndefined();
    expect(draft.izrzSign).toBeUndefined();
    expect(draft.sourceInfo).toBeUndefined();
    expect(draft.scheduleEventId).toBeUndefined();
  });

  it("renders ActionEditorHeader with copy badge when isDuplicate is true and fires onDuplicate", async () => {
    const React = await import("react");
    const { render, screen, fireEvent } = await import("@testing-library/react");

    const onDuplicateMock = vi.fn();
    const { unmount } = render(
      React.createElement(ActionEditorHeader, {
        editingAction: null,
        isDuplicate: true,
        date: "2026-05-12",
        onCancel: vi.fn(),
        onDuplicate: onDuplicateMock,
      })
    );

    expect(screen.getByText("Nowe Działanie (Kopia)")).toBeDefined();
    expect(screen.getByText("Kopia zadania")).toBeDefined();
    expect(screen.getByText("Kopiuj zadanie")).toBeDefined();

    fireEvent.click(screen.getByText("Kopiuj zadanie"));
    expect(onDuplicateMock).toHaveBeenCalledTimes(1);
    unmount();
  });
});
