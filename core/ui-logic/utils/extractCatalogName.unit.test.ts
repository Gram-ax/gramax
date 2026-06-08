import { extractCatalogName } from "@core-ui/utils/extractCatalogName";

describe("extractCatalogName", () => {
	it("extract catalog name without additional metadata", () => {
		expect(extractCatalogName("my-catalog")).toBe("my-catalog");

		expect(extractCatalogName("my-catalog:commit-abc123def456")).toBe("my-catalog");

		expect(extractCatalogName("my-catalog~commit-abc123def456")).toBe("my-catalog");
	});
});
