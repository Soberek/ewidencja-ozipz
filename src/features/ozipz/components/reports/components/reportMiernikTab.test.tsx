import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReportMiernikTab, type MetricSummaryState } from "./ReportMiernikTab";
import { emptyMetricPlan } from "./reportConstants";
import type { OzipzAction } from "../../../types/ozipz.types";

const exports = vi.hoisted(() => ({
  exportToTemplate: vi.fn().mockResolvedValue(true),
  exportToAnnex2Template: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../utils/reportAnnex", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../utils/reportAnnex")>()),
  ...exports,
}));

const action = (id: string, date: string, numberOfActions: number): OzipzAction => ({
  id,
  title: "Prelekcja",
  actionType: "Prelekcja",
  date,
  numberOfActions,
  participantsCount: 10,
  status: "wykonane",
}) as OzipzAction;

const summary: MetricSummaryState = {
  totalActions: 0,
  totalPeople: 0,
  programoweActions: 0,
  programowePeople: 0,
  otherActions: 0,
  otherPeople: 0,
  totalActionsPercent: null,
  totalPeoplePercent: null,
  programActionsPercent: null,
  programPeoplePercent: null,
};

describe("ReportMiernikTab – eksport załączników", () => {
  beforeEach(() => vi.clearAllMocks());

  const january = action("january", "2026-01-15", 5);
  const july = action("july", "2026-07-10", 2);
  const september = action("september", "2026-09-20", 3);

  const renderTab = () => render(
    <ReportMiernikTab
      exportOpen
      year={2026}
      yearActions={[january, july, september]}
      filteredActions={[july, september]}
      months={[7, 8, 9]}
      metricPlan={emptyMetricPlan}
      metricSummary={summary}
      onMetricPlanChange={() => undefined}
      onPersistMetricPlan={async () => true}
      metricPlanSource={{ kind: "saved" }}
      showKpiSummary={false}
    />
  );

  it("Załącznik nr 2 obejmuje tylko wybrane miesiące, bez działań od stycznia", async () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Załącznik nr 2/ }));

    await waitFor(() => expect(exports.exportToAnnex2Template).toHaveBeenCalledTimes(1));
    const [data, fileName, , headerTitle] = exports.exportToAnnex2Template.mock.calls[0];
    expect(data.allActions).toBe(5);
    expect(fileName).toBe("PSSE_Mysliborz_Zalacznik_nr_2_OZIPZ_2026_lipiec-wrzesien");
    expect(headerTitle).toBe("Załącznik nr 2 OZiPZ PSSE w Myśliborzu mierniki za lipiec - wrzesień (III kwartał) 2026 r.");
  });

  it("Załącznik nr 1 ma nazwę pliku bez polskich znaków i nawiasów", async () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Załącznik nr 1/ }));

    await waitFor(() => expect(exports.exportToTemplate).toHaveBeenCalledTimes(1));
    const [data, fileName] = exports.exportToTemplate.mock.calls[0];
    expect(data.allActions).toBe(5);
    expect(fileName).toBe("PSSE_Mysliborz_Zalacznik_nr_1_OZIPZ_2026_lipiec-wrzesien");
  });
});
