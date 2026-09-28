import { describe, expect, it } from "vitest";
import type { OzipzAction } from "../../types/ozipz.types";
import { getActionEzdState } from "./actionEzdStatus";

function action(overrides: Partial<OzipzAction>): OzipzAction {
  const base: OzipzAction = {
    id: "action-1",
    title: "Test",
    actionType: "Prelekcja",
    date: "2026-09-09",
    facilityName: "Placówka",
    municipality: "Myślibórz",
    topic: "Zdrowie",
    audienceGroup: "Dorośli",
    participantsCount: 1,
    indirectRecipientsCount: 0,
    materialsDistributedCount: 0,
    status: "wykonane",
    ezdStatus: "do_ezd",
    leadEducator: "Edukator",
    createdAt: "2026-09-09",
    updatedAt: "2026-09-09",
  };
  return { ...base, ...overrides, ezdStatus: overrides.ezdStatus ?? base.ezdStatus };
}

describe("getActionEzdState", () => {
  it("does not mark statuses outside the EZD workflow as pending", () => {
    expect(getActionEzdState(action({ ezdStatus: "nie_dotyczy" }))).toBe("not_applicable");
    expect(getActionEzdState(action({ ezdStatus: "brak_ezd" }))).toBe("not_applicable");
  });

  it("uses one interpretation for pending and registered records", () => {
    expect(getActionEzdState(action({ ezdStatus: "do_ezd" }))).toBe("pending");
    expect(getActionEzdState(action({ ezdStatus: "w_ezd" }))).toBe("registered");
    expect(getActionEzdState(action({ ezdStatus: "", jrwaSign: "OZiPZ.966.1.1.2026" }))).toBe("registered");
  });
});
