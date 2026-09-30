import { describe, expect, it } from "vitest";
import {
  WORK_DAY_REQUEST_DEFAULTS,
  buildWorkDayRequestHtml,
  buildWorkDayRequestSentence,
  describeWorkDay,
  validateWorkDayRequest,
  type WorkDayRequest,
} from "./workDayRequest";

const validRequest: WorkDayRequest = {
  ...WORK_DAY_REQUEST_DEFAULTS,
  issueDate: "2026-09-30",
  purpose: "organizacją stoiska profilaktyczno-edukacyjnego",
  eventName: "XLV Jesienne Biegi Leśne",
  location: "w Barlinku",
  workDate: "2026-10-03",
  timeFrom: "",
  timeTo: "",
  employees: [
    { id: "a", unit: "OZiPZ", fullName: "Jan Kowalski" },
    { id: "b", unit: "EP", fullName: "Anna Nowak" },
  ],
};

const messagesFor = (request: WorkDayRequest, severity: "error" | "warning") =>
  validateWorkDayRequest(request).filter((issue) => issue.severity === severity).map((issue) => issue.field);

describe("describeWorkDay", () => {
  it("rozpoznaje sobotę, niedzielę, święto i dzień roboczy", () => {
    expect(describeWorkDay("2026-10-03")).toMatchObject({ kind: "saturday", phrase: "w sobotę 3 października 2026 r." });
    expect(describeWorkDay("2026-10-04")?.kind).toBe("sunday");
    expect(describeWorkDay("2026-11-11")).toMatchObject({ kind: "holiday", phrase: "w środę 11 listopada 2026 r. (Narodowe Święto Niepodległości)" });
    expect(describeWorkDay("2026-10-06")).toMatchObject({ kind: "workday", phrase: "we wtorek 6 października 2026 r." });
    expect(describeWorkDay("2026-02-31")).toBeNull();
  });
});

describe("validateWorkDayRequest", () => {
  it("przepuszcza poprawny wniosek bez uwag", () => {
    expect(validateWorkDayRequest(validRequest)).toEqual([]);
  });

  it("wymaga celu, miejsca, dnia pracy i pracowników", () => {
    const errors = messagesFor({ ...validRequest, purpose: " ", location: "", workDate: "", employees: [] }, "error");
    expect(errors).toEqual(expect.arrayContaining(["purpose", "location", "workDate", "employees"]));
  });

  it("wymaga komórki i imienia pracownika oraz wyłapuje duplikaty", () => {
    const errors = messagesFor(
      {
        ...validRequest,
        employees: [
          { id: "a", unit: "", fullName: "" },
          { id: "b", unit: "EP", fullName: "Anna Nowak" },
          { id: "c", unit: "EP", fullName: " anna  nowak " },
        ],
      },
      "error"
    );
    expect(errors).toEqual(["employee:a:unit", "employee:a:fullName", "employee:c:fullName"]);
  });

  it("blokuje dzień pracy sprzed daty wniosku i błędne godziny", () => {
    expect(messagesFor({ ...validRequest, workDate: "2026-09-26" }, "error")).toContain("workDate");
    expect(messagesFor({ ...validRequest, timeFrom: "14:00", timeTo: "" }, "error")).toContain("time");
    expect(messagesFor({ ...validRequest, timeFrom: "14:00", timeTo: "09:00" }, "error")).toContain("time");
    expect(messagesFor({ ...validRequest, timeFrom: "09:00", timeTo: "14:00" }, "error")).toEqual([]);
  });

  it("ostrzega przed dniem roboczym, miejscem bez przyimka i cudzysłowem w nazwie", () => {
    const warnings = messagesFor(
      { ...validRequest, workDate: "2026-10-06", location: "Barlinek", eventName: "„Biegi”", purpose: "W związku z biegiem" },
      "warning"
    );
    expect(warnings).toEqual(expect.arrayContaining(["workDate", "location", "eventName", "purpose"]));
  });
});

describe("buildWorkDayRequestHtml", () => {
  it("składa treść jak we wzorze wniosku", () => {
    expect(buildWorkDayRequestSentence(validRequest)).toBe(
      "W związku z organizacją stoiska profilaktyczno-edukacyjnego podczas wydarzenia „XLV Jesienne Biegi Leśne” w Barlinku, " +
        "które odbędzie się w sobotę 3 października 2026 r., wnioskujemy o wyrażenie zgody na pracę w tym dniu dla następujących pracowników:"
    );
    const html = buildWorkDayRequestHtml(validRequest);
    expect(html).toContain("Myślibórz, dn. 30.09.2026 r.");
    expect(html).toContain("Dyrektor Powiatowej Stacji Sanitarno-Epidemiologicznej<br>w Myśliborzu");
    expect(html).toContain("<li>OZiPZ – Jan Kowalski</li><li>EP – Anna Nowak.</li>");
  });

  it("pomija wydarzenie, dodaje godziny i escapuje tekst", () => {
    const sentence = buildWorkDayRequestSentence({ ...validRequest, eventName: "", timeFrom: "09:00", timeTo: "14:00" });
    expect(sentence).toBe(
      "W związku z organizacją stoiska profilaktyczno-edukacyjnego w Barlinku w sobotę 3 października 2026 r. " +
        "wnioskujemy o wyrażenie zgody na pracę w tym dniu w godzinach 09:00–14:00 dla następujących pracowników:"
    );
    expect(buildWorkDayRequestHtml({ ...validRequest, purpose: "<b>x</b>" })).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});
