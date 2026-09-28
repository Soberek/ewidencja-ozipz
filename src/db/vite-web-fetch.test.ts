import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllowedWebPage, parseAllowedWebUrl } from "./vite-web-fetch";

afterEach(() => vi.unstubAllGlobals());

describe("vite web fetch (źródła publikacji)", () => {
  it("allows only exact HTTPS publication hosts", () => {
    expect(parseAllowedWebUrl("https://www.gov.pl/web/psse-mysliborz/aktualnosci2")).not.toBeNull();
    expect(parseAllowedWebUrl("https://cdn.syndication.twimg.com/tweet-result?id=1")).not.toBeNull();
    for (const url of ["http://www.gov.pl/", "https://evil.gov.pl/", "https://www.gov.pl.evil.test/", "https://u:p@www.gov.pl/", "https://127.0.0.1/", 42]) {
      expect(parseAllowedWebUrl(url)).toBeNull();
    }
  });

  it("follows redirects within allowed hosts and stops at a foreign one", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: "/web/gis/artykul" } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://example.com/x" } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchAllowedWebPage("https://www.gov.pl/web/psse-mysliborz/artykul", true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://www.gov.pl/web/gis/artykul");
    expect(res.finalUrl).toBe("https://example.com/x");
    expect(res.body).toBe("");
  });

  it("returns the page body for a normal response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>ok</html>", { status: 200 })));
    await expect(fetchAllowedWebPage("https://www.gov.pl/web/psse-mysliborz/aktualnosci2")).resolves.toEqual({
      finalUrl: "https://www.gov.pl/web/psse-mysliborz/aktualnosci2",
      status: 200,
      body: "<html>ok</html>",
    });
    await expect(fetchAllowedWebPage("https://example.com/")).rejects.toThrow("spoza listy");
  });
});
