import { describe, it, expect, vi } from "vitest";
import {
  parseGovDate,
  absolutizeGovUrl,
  isPsseMysliborzUrl,
  parseGovAktualnosciHtml,
  resolveGovRedirect,
  decodeHtmlText,
} from "./govSource";
import { matchTopicAndJrwa } from "./topicMatcher";

vi.mock("./webFetch", () => ({ fetchSourcePage: vi.fn() }));
import { fetchSourcePage } from "./webFetch";

describe("PSSE Myślibórz Publications Scraper Module", () => {
  it("correctly parses Polish dates DD.MM.YYYY into YYYY-MM-DD", () => {
    expect(parseGovDate("24.08.2026")).toBe("2026-08-24");
    expect(parseGovDate("01.01.2026")).toBe("2026-01-01");
    expect(parseGovDate("  05.11.2025  ")).toBe("2025-11-05");
    expect(parseGovDate("niepoprawna data")).toBeNull();
    expect(parseGovDate("32.13.2026")).toBeNull();
    expect(parseGovDate("31.02.2026")).toBeNull();
    expect(parseGovDate("29.02.2024")).toBe("2024-02-29");
  });

  it("defaults a malformed publication date to the local day", () => {
    vi.stubEnv("TZ", "Europe/Warsaw");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T23:30:00Z"));
      const html = '<li><span class="date">31.02.2026</span><div class="title"><a href="/web/psse-mysliborz/a">A</a></div></li>';
      expect(parseGovAktualnosciHtml(html).items[0].date).toBe("2026-01-02");
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });

  it("absolutizes relative gov.pl URLs", () => {
    expect(
      absolutizeGovUrl("/web/psse-mysliborz/kleszcze-sa-male-ale-zagrozenie-moze-byc-duze")
    ).toBe("https://www.gov.pl/web/psse-mysliborz/kleszcze-sa-male-ale-zagrozenie-moze-byc-duze");

    expect(
      absolutizeGovUrl("https://gis.gov.pl/aktualnosci/artykul")
    ).toBe("https://gis.gov.pl/aktualnosci/artykul");
  });

  it("identifies local PSSE Myślibórz URLs vs external governmental portals", () => {
    expect(
      isPsseMysliborzUrl("https://www.gov.pl/web/psse-mysliborz/aktualnosci")
    ).toBe(true);

    expect(
      isPsseMysliborzUrl("https://gov.pl/web/psse-mysliborz/artykul-1")
    ).toBe(true);

    expect(
      isPsseMysliborzUrl("https://www.gov.pl/web/gis/komunikat")
    ).toBe(false);

    expect(isPsseMysliborzUrl("https://facebook.com/pssemysliborz")).toBe(false);
  });

  it("matches topics and JRWA symbols automatically based on health keywords", () => {
    const resGrzyb = matchTopicAndJrwa("Kurs dla kandydatów na klasyfikatorów grzybów");
    expect(resGrzyb.topic).toContain("grzyb");
    expect(resGrzyb.suggestedJrwa).toBe("9011");

    const resKleszcz = matchTopicAndJrwa("Kleszcze: małe, ale groźne!");
    expect(resKleszcz.topic).toContain("Choroby odkleszczowe");
    expect(resKleszcz.suggestedJrwa).toBe("9011");

    const resBeauty = matchTopicAndJrwa("Zalecenia i wymagania higieniczno-sanitarne w branży beauty");
    expect(resBeauty.topic).toContain("beauty");
    expect(resBeauty.suggestedJrwa).toBe("9010");
  });

  it("extracts articles correctly from sample gov.pl HTML chunk", () => {
    const sampleHtml = `
      <ul class="art-prev">
        <li>
          <div>
            <div class="event">
              <span class="date">24.08.2026</span>
            </div>
            <div class="title">
              <a href="/web/psse-mysliborz/kleszcze-sa-male"> Kleszcze: małe, ale groźne! </a>
            </div>
          </div>
        </li>
        <li>
          <div>
            <div class="event">
              <span class="date">19.08.2026</span>
            </div>
            <div class="title">
              <a href="/web/psse-mysliborz/szkola-przestrzen-zdrowego-odzywiania"> Szkoła - przestrzeń zdrowego odżywiania </a>
            </div>
          </div>
        </li>
      </ul>
    `;

    const { items } = parseGovAktualnosciHtml(sampleHtml);
    expect(items.length).toBe(2);

    expect(items[0].title).toBe("Kleszcze: małe, ale groźne!");
    expect(items[0].date).toBe("2026-08-24");
    expect(items[0].url).toBe("https://www.gov.pl/web/psse-mysliborz/kleszcze-sa-male");
    expect(items[0].key).toBe("gov.pl/web/psse-mysliborz/kleszcze-sa-male");
    expect(items[0].external).toBe(false);
    expect(items[0].unverified).toBe(true);
    expect(items[0].topic).toContain("Choroby odkleszczowe");

    expect(items[1].title).toBe("Szkoła - przestrzeń zdrowego odżywiania");
    expect(items[1].date).toBe("2026-08-19");
    expect(items[1].topic).toContain("odżywianie");
  });

  it("differentiates between local PSSE Myślibórz posts and external portal redirects", () => {
    const mixedHtml = `
      <ul class="art-prev">
        <li>
          <div>
            <div class="event"><span class="date">15.08.2026</span></div>
            <div class="title"><a href="/web/psse-mysliborz/lokalny-artykul"> Lokalny komunikat PSSE </a></div>
          </div>
        </li>
        <li>
          <div>
            <div class="event"><span class="date">14.08.2026</span></div>
            <div class="title"><a href="https://gis.gov.pl/aktualnosci/ogolnopolski-komunikat"> Ogólnopolski komunikat GIS </a></div>
          </div>
        </li>
      </ul>
    `;

    const { items } = parseGovAktualnosciHtml(mixedHtml);
    expect(items.length).toBe(2);
    expect(items[0].external).toBe(false);
    expect(items[1].external).toBe(true);
  });

  it("matches strictly with programs from programs dictionary", () => {
    const mockPrograms = [
      {
        id: "prog-1",
        code: "SZKOLA_ZDROWIA",
        name: "Szkoła - przestrzeń zdrowego odżywiania",
        editionYear: "2026",
        jrwaSymbol: "9011",
        targetAudience: "Dzieci i młodzież",
        description: "",
        status: "aktywny",
        participatingSchoolsCount: 0,
        totalPupilsReached: 0,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const res = matchTopicAndJrwa("Szkoła - przestrzeń zdrowego odżywiania - komunikat", mockPrograms);
    expect(res.programId).toBe("prog-1");
    expect(res.programName).toBe("Szkoła - przestrzeń zdrowego odżywiania");
    expect(res.suggestedJrwa).toBe("9011");
  });

  it("reads total page count and decodes HTML entities in titles", () => {
    const html = `<li><div class="event"><span class="date">01.09.2026</span></div><div class="title"><a href="/web/psse-mysliborz/a">Kampania &bdquo;Nie odbieraj&rdquo; &#8211; test</a></div></li>
      <a href="?page=52&size=10" class="pagination__total-count" id="js-pagination-pages-count"> 52 </a>`;
    const parsed = parseGovAktualnosciHtml(html);
    expect(parsed.totalPages).toBe(52);
    expect(parsed.items[0].title).toBe("Kampania „Nie odbieraj” – test");
    expect(decodeHtmlText("A&nbsp;&amp;&nbsp;B")).toBe("A & B");
  });

  it("marks PSSE entries that redirect to another unit (GIS/WSSE) as external", async () => {
    const [item] = parseGovAktualnosciHtml('<li><span class="date">02.09.2026</span><div class="title"><a href="/web/psse-mysliborz/jesien-bez-infekcji">Jesień bez infekcji</a></div></li>').items;
    vi.mocked(fetchSourcePage).mockResolvedValueOnce({ finalUrl: "https://www.gov.pl/web/gis/jesien-bez-infekcji", status: 200, body: "" });
    const redirected = await resolveGovRedirect(item);
    expect(redirected.external).toBe(true);
    expect(redirected.finalUrl).toBe("https://www.gov.pl/web/gis/jesien-bez-infekcji");
    expect(redirected.unverified).toBe(false);

    vi.mocked(fetchSourcePage).mockResolvedValueOnce({ finalUrl: item.url, status: 200, body: "" });
    expect((await resolveGovRedirect(item)).external).toBe(false);

    vi.mocked(fetchSourcePage).mockRejectedValueOnce(new Error("offline"));
    const failed = await resolveGovRedirect(item);
    expect(failed.external).toBe(false);
    expect(failed.unverified).toBe(true);
  });
});
