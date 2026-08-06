import { describe, expect, it } from "vitest";
import {
  actionDataEqual,
  parseActionData,
  serializeActionData,
} from "../src/actionDataYaml";

describe("actionDataYaml", () => {
  it("roundtrips HA-style flat data lines", () => {
    const source = "name: day\nvalue: Mornining\nrun: true";
    const parsed = parseActionData(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.data).toEqual({
      name: "day",
      value: "Mornining",
      run: true,
    });
    const again = parseActionData(serializeActionData(parsed.data));
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    expect(again.data).toEqual(parsed.data);
  });

  it("parses numbers, null, quoted strings, and JSON objects", () => {
    const parsed = parseActionData(
      [
        "brightness: 50",
        "temp: 21.5",
        "flag: false",
        "empty: null",
        'message: "hello: world"',
        'payload: {"a":1,"b":true}',
        "# comment ignored",
        "",
      ].join("\n")
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.data).toEqual({
      brightness: 50,
      temp: 21.5,
      flag: false,
      empty: null,
      message: "hello: world",
      payload: { a: 1, b: true },
    });
  });

  it("accepts a JSON object body", () => {
    const parsed = parseActionData('{"name":"day","run":true}');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.data).toEqual({ name: "day", run: true });
  });

  it("returns empty object for blank input", () => {
    expect(parseActionData("   \n  ")).toEqual({ ok: true, data: {} });
    expect(serializeActionData({})).toBe("");
    expect(serializeActionData(null)).toBe("");
  });

  it("reports invalid lines without suggesting wipe", () => {
    const parsed = parseActionData("name day\nrun: true");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error).toMatch(/line 1/i);
  });

  it("rejects non-object JSON roots", () => {
    const parsed = parseActionData("[1,2]");
    expect(parsed.ok).toBe(false);
  });

  it("compares data objects ignoring key order", () => {
    expect(actionDataEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(actionDataEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});
