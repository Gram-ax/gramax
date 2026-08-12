import { compressOptionsFor, optimalCompressRules } from "@core/FileProvider/model/CompressOptions";

describe("compressOptionsFor", () => {
	const rules = [
		{ source: "png", target: "webp" as const, quality: 90, effort: 5 },
		{ source: "jpeg", target: "jpeg" as const, quality: 70, effort: 3 },
	];

	it("returns the rule matching the source extension", () => {
		expect(compressOptionsFor(rules, "png")).toEqual({ type: "image", target: "webp", quality: 90, effort: 5 });
	});

	it("matches the .jpg extension against the jpeg rule", () => {
		expect(compressOptionsFor(rules, "jpg")).toEqual({ type: "image", target: "jpeg", quality: 70, effort: 3 });
	});

	it("is case-insensitive", () => {
		expect(compressOptionsFor(rules, "PNG")?.target).toBe("webp");
	});

	it("returns null when no rule covers the extension", () => {
		expect(compressOptionsFor(rules, "gif")).toBeNull();
		expect(compressOptionsFor(rules, "")).toBeNull();
	});

	it("returns null when there are no rules at all", () => {
		expect(compressOptionsFor([], "png")).toBeNull();
	});
});

describe("optimalCompressRules", () => {
	it("converts every supported source format to jpeg", () => {
		const rules = optimalCompressRules();

		expect(rules.map((r) => r.source).sort()).toEqual(["jpeg", "png", "webp"]);
		expect(rules.every((r) => r.target === "jpeg")).toBe(true);
	});

	it("drives compressOptionsFor to jpeg for every image extension", () => {
		const rules = optimalCompressRules();

		for (const extension of ["png", "jpg", "jpeg", "webp"]) {
			expect(compressOptionsFor(rules, extension)?.target).toBe("jpeg");
		}
	});
});
