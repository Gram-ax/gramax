import { describe, expect, it } from "@jest/globals";
import getCatalogNameWithoutCommitOid from "./getCatalogNameWithoutCommitOid";

describe("getCatalogNameWithoutCommitOid", () => {
	it("removes commit OID scope with colon separator", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog:commit-abc123def456")).toBe("my-catalog");
		expect(getCatalogNameWithoutCommitOid("my-catalog:commit-1a2b3c4d5e6f")).toBe("my-catalog");
	});

	it("removes commit OID scope with tilde separator (cli)", () => {
		expect(getCatalogNameWithoutCommitOid("my-catalog~commit-abc123def456")).toBe("my-catalog");
		expect(getCatalogNameWithoutCommitOid("my-catalog~commit-1a2b3c4d5e6f")).toBe("my-catalog");
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
