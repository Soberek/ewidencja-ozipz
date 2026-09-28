import { describe, it, expect, vi } from "vitest";
import { dateFromTweetId, extractTweetIds, fetchXPostById, parseXTimelineHtml, tweetResultToken, tweetTitle } from "./xSource";

vi.mock("./webFetch", () => ({ fetchSourcePage: vi.fn() }));
import { fetchSourcePage } from "./webFetch";

const timelineHtml = (tweets: unknown[]) =>
  `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { timeline: { entries: tweets.map((tweet) => ({ type: "tweet", content: { tweet } })) } } },
  })}</script></html>`;

describe("X/Twitter Scraper Module (@PSSEMysliborz)", () => {
  it("decodes publication date correctly from Twitter Snowflake ID", () => {
    expect(dateFromTweetId("2088667997883732462")).toBe("2026-08-15");
    expect(dateFromTweetId("2087598747869946059")).toBe("2026-08-12");
    expect(dateFromTweetId("2076559939934228942")).toBe("2026-07-13");
    expect(dateFromTweetId("2068934130121773464")).toBe("2026-06-22");
    expect(dateFromTweetId("2067935598959046828")).toBe("2026-06-19");
  });

  it("uses the local day for posts near UTC midnight and for invalid IDs", () => {
    vi.stubEnv("TZ", "Europe/Warsaw");
    vi.useFakeTimers();
    try {
      const instant = new Date("2026-01-01T23:30:00Z");
      vi.setSystemTime(instant);
      const id = ((BigInt(instant.getTime()) - 1288834974657n) << 22n).toString();
      expect(dateFromTweetId(id)).toBe("2026-01-02");
      expect(dateFromTweetId("")).toBe("2026-01-02");
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });

  it("reads own posts from the syndication timeline and skips retweets", () => {
    const html = timelineHtml([
      {
        id_str: "2088667997883732462",
        created_at: "Sat Aug 15 16:43:50 +0000 2026",
        full_text: "Jasne, zwłaszcza białe ubrania, odbijają więcej promieniowania słonecznego. ☀️ W upał pij wodę. #Lato https://t.co/abc",
        user: { screen_name: "PSSEMysliborz" },
      },
      {
        id_str: "2087598747869946059",
        created_at: "Wed Aug 12 10:00:00 +0000 2026",
        full_text: "Wirus WZW A może przenosić się przez skażoną żywność. #WZWA",
        user: { screen_name: "PSSEMysliborz" },
      },
      { id_str: "2087000000000000000", full_text: "RT @GIS_gov: komunikat", user: { screen_name: "PSSEMysliborz" } },
      { id_str: "2086000000000000000", full_text: "Wpis innego konta", user: { screen_name: "GIS_gov" } },
    ]);

    const posts = parseXTimelineHtml(html);
    expect(posts.map((p) => p.key)).toEqual(["x:2088667997883732462", "x:2087598747869946059"]);
    expect(posts[0].date).toBe("2026-08-15");
    expect(posts[0].url).toBe("https://x.com/PSSEMysliborz/status/2088667997883732462");
    expect(posts[0].title).toBe("Jasne, zwłaszcza białe ubrania, odbijają więcej promieniowania słonecznego.");
    expect(posts[0].text).not.toContain("t.co");
    expect(posts[1].topic).toContain("WZW");
    expect(posts[1].suggestedJrwa).toBe("9011");
    expect(parseXTimelineHtml("<html>bez danych</html>")).toEqual([]);
  });

  it("builds a short title from the first sentence without trailing hashtags", () => {
    expect(tweetTitle("Jaka herbata i na co? Sprawdź nasz poradnik. #zdrowie #herbata")).toBe("Jaka herbata i na co?");
    expect(tweetTitle("Krótko #tag")).toBe("Krótko");
    expect(tweetTitle("a".repeat(10) + " " + "słowo ".repeat(40)).endsWith("…")).toBe(true);
  });

  it("extracts post IDs from pasted links", () => {
    expect(
      extractTweetIds("https://x.com/PSSEMysliborz/status/2088667997883732462 oraz https://twitter.com/PSSEMysliborz/status/2087598747869946059?s=20, 2088667997883732462")
    ).toEqual(["2088667997883732462", "2087598747869946059"]);
    expect(extractTweetIds("brak linków")).toEqual([]);
  });

  it("fetches a single post and falls back to the Snowflake date when X does not answer", async () => {
    vi.mocked(fetchSourcePage).mockResolvedValueOnce({
      finalUrl: "",
      status: 200,
      body: JSON.stringify({ id_str: "2088667997883732462", text: "Kleszcze są groźne. Sprawdź!", created_at: "2026-08-15T16:43:50.000Z", user: { screen_name: "PSSEMysliborz" } }),
    });
    const post = await fetchXPostById("2088667997883732462");
    expect(post.title).toBe("Kleszcze są groźne.");
    expect(vi.mocked(fetchSourcePage).mock.calls[0][0]).toContain(`token=${tweetResultToken("2088667997883732462")}`);

    vi.mocked(fetchSourcePage).mockRejectedValueOnce(new Error("429"));
    const fallback = await fetchXPostById("2087598747869946059");
    expect(fallback.title).toBe("");
    expect(fallback.date).toBe("2026-08-12");
    expect(fallback.unverified).toBe(true);
  });
});
