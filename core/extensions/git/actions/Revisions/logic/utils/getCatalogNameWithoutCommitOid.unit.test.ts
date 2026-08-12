import { describe, expect, it } from "@jest/globals";
import getCatalogNameWithoutCommitOid from "./getCatalogNameWithoutCommitOid";

const OLD = "a".repeat(40);
const NEW = "b".repeat(40);

describe("getCatalogNameWithoutCommitOid", () => {
	it("removes commit OID scope with colon separator", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog:commit-abc123def456")).toBe("my-catalog");
		expect(getCatalogNameWithoutCommitOid("my-catalog:commit-1a2b3c4d5e6f")).toBe("my-catalog");
	});

	it("removes commit OID scope with tilde separator (cli)", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog~commit-abc123def456")).toBe("my-catalog");
		expect(getCatalogNameWithoutCommitOid("my-catalog~commit-1a2b3c4d5e6f")).toBe("my-catalog");
	});

	it("removes dif- scope with colon separator", () => {
		expect(getCatalogNameWithoutCommitOid(`my-catalog:dif-${OLD}-${NEW}`)).toBe("my-catalog");
	});

	it("removes dif- scope with tilde separator", () => {
		expect(getCatalogNameWithoutCommitOid(`my-catalog~dif-${OLD}-${NEW}`)).toBe("my-catalog");
	});

	it("does not remove dif- scope with short hashes", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog:dif-abc123-def456")).toBe("my-catalog:dif-abc123-def456");
	});

	it("does not modify catalog name without commit OID", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog")).toBe("my-catalog");
		expect(getCatalogNameWithoutCommitOid("some-catalog:feature-branch")).toBe("some-catalog:feature-branch");
	});

	it("does not remove non-hex commit OID", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog:commit-xyz")).toBe("my-catalog:commit-xyz");
		expect(getCatalogNameWithoutCommitOid("my-catalog:commit-")).toBe("my-catalog:commit-");
	});

	it("returns same value for null or undefined", () => {
		expect(getCatalogNameWithoutCommitOid(null as unknown as string)).toBeNull();
		expect(getCatalogNameWithoutCommitOid(undefined as unknown as string)).toBeUndefined();
	});
});
