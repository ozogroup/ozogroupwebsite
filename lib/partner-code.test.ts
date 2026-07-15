import { describe, it, expect } from "vitest";
import { normalizeKiaPartnerCode, getNextKiaPartnerCode, isPartnerCodeConflict } from "./partner-code";

describe("normalizeKiaPartnerCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeKiaPartnerCode("  kia1001  ")).toBe("KIA1001");
  });

  it("migrates the legacy OZO prefix to KIA", () => {
    expect(normalizeKiaPartnerCode("ozo1042")).toBe("KIA1042");
  });

  it("returns empty string for null/undefined/blank input", () => {
    expect(normalizeKiaPartnerCode(null)).toBe("");
    expect(normalizeKiaPartnerCode(undefined)).toBe("");
    expect(normalizeKiaPartnerCode("   ")).toBe("");
  });
});

describe("getNextKiaPartnerCode", () => {
  it("starts at KIA1001 with no existing codes", () => {
    expect(getNextKiaPartnerCode([])).toBe("KIA1001");
  });

  it("continues from the highest existing KIA or legacy OZO number", () => {
    expect(getNextKiaPartnerCode(["KIA1001", "KIA1002", "OZO1003"])).toBe("KIA1004");
  });

  it("ignores malformed/unrelated codes", () => {
    expect(getNextKiaPartnerCode(["KIA1001", null, undefined, "not-a-code", ""])).toBe("KIA1002");
  });
});

describe("isPartnerCodeConflict", () => {
  it("recognizes a unique-constraint violation mentioning partner_code", () => {
    expect(isPartnerCodeConflict({ code: "23505", message: "duplicate key value violates unique constraint \"partners_partner_code_key\"" })).toBe(true);
  });

  it("does not misclassify an unrelated unique-constraint violation", () => {
    expect(isPartnerCodeConflict({ code: "23505", message: "duplicate key value violates unique constraint \"profiles_email_key\"" })).toBe(false);
  });

  it("does not misclassify a non-conflict error", () => {
    expect(isPartnerCodeConflict({ code: "42501", message: "permission denied" })).toBe(false);
  });
});
