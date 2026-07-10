import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("maps rows to objects keyed by the header row", () => {
    const rows = parseCsv(Buffer.from("Full Name,Phone\nJohn,123\nJane,456\n"));
    expect(rows).toEqual([
      { "Full Name": "John", Phone: "123" },
      { "Full Name": "Jane", Phone: "456" },
    ]);
  });

  it("handles quoted fields containing commas", () => {
    const rows = parseCsv(
      Buffer.from('name,note\n"Doe, John","Busy, call later"\n')
    );
    expect(rows[0]["name"]).toBe("Doe, John");
    expect(rows[0]["note"]).toBe("Busy, call later");
  });

  it("skips empty lines", () => {
    const rows = parseCsv(Buffer.from("a,b\n1,2\n\n3,4\n"));
    expect(rows).toHaveLength(2);
  });

  it("trims surrounding whitespace from values", () => {
    const rows = parseCsv(Buffer.from("a,b\n  x  ,  y  \n"));
    expect(rows[0]).toEqual({ a: "x", b: "y" });
  });

  it("returns an empty array for a header-only file", () => {
    const rows = parseCsv(Buffer.from("a,b\n"));
    expect(rows).toEqual([]);
  });
});
