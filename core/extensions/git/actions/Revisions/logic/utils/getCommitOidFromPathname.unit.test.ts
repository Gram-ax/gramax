import { describe, expect, it } from "@jest/globals";
import getCommitOidFromPathname from "./getCommitOidFromPathname";

describe("getCommitOidFromPathname", () => {
	it("extracts commit OID from pathname", () => {
		expect(getCommitOidFromPathname("path/commit-abc123def456/other")).toBe("abc123def456");
		expect(getCommitOidFromPathname("commit-abc123")).toBe("abc123");
		expect(getCommitOidFromPathname("-/-/-/-/catalog/commit-1a2b3c4d5e6f")).toBe("1a2b3c4d5e6f");
	});

	it("returns undefined when commit OID is not found", () => {
		expect(getCommitOidFromPathname("path/without/commit")).toBeUndefined();
		expect(getCommitOidFromPathname("")).toBeUndefined();
		expect(getCommitOidFromPathname("commit-")).toBeUndefined();
		expect(getCommitOidFromPathname("commit-xyz")).toBeUndefined();
	});

	it("supports only hex characters in OID", () => {
		expect(getCommitOidFromPathname("commit-abcdef123456")).toBe("abcdef123456");
		expect(getCommitOidFromPathname("commit-0123456789abcdef")).toBe("0123456789abcdef");
	});

	it("returns undefined for null or undefined", () => {
		expect(getCommitOidFromPathname(null as unknown as string)).toBeUndefined();
		expect(getCommitOidFromPathname(undefined as unknown as string)).toBeUndefined();
	});
});
