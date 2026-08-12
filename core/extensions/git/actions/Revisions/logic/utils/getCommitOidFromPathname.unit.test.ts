import { describe, expect, it } from "@jest/globals";
import getCommitOidFromPathname, { getNewCommitOidFromPathname } from "./getCommitOidFromPathname";

const OLD = "a".repeat(40);
const NEW = "b".repeat(40);

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

	it("returns [oldOid, newOid] for dif- scope", () => {
		expect(getCommitOidFromPathname(`catalog:dif-${OLD}-${NEW}/article`)).toEqual([OLD, NEW]);
		expect(getCommitOidFromPathname(`dif-${OLD}-${NEW}`)).toEqual([OLD, NEW]);
	});

	it("returns undefined for dif- with short hashes", () => {
		expect(getCommitOidFromPathname("dif-abc123-def456")).toBeUndefined();
	});
});

describe("getNewCommitOidFromPathname", () => {
	it("returns newCommit OID for dif- scope", () => {
		expect(getNewCommitOidFromPathname(`catalog:dif-${OLD}-${NEW}`)).toBe(NEW);
	});

	it("returns commit OID for commit- scope", () => {
		expect(getNewCommitOidFromPathname("catalog:commit-abc123")).toBe("abc123");
	});

	it("returns undefined when no scope present", () => {
		expect(getNewCommitOidFromPathname("catalog/article")).toBeUndefined();
		expect(getNewCommitOidFromPathname(null as unknown as string)).toBeUndefined();
	});
});
