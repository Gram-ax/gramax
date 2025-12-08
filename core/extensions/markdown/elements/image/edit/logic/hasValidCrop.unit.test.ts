import hasValidCrop from "@ext/markdown/elements/image/edit/logic/hasValidCrop";
import type { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

describe("hasValidCrop", () => {
	const validCrop: Crop = { x: 10, y: 5, w: 30, h: 25 };

	test("returns true for a crop fully inside the 0-100 bounds", () => {
		expect(hasValidCrop(validCrop)).toBe(true);
	});

	test("allows crops that touch the 100% boundary", () => {
		expect(hasValidCrop({ x: 80, y: 90, w: 20, h: 10 })).toBe(true);
	});

	type InvalidCase = { name: string; crop?: Partial<Crop> };

	const invalidCases: InvalidCase[] = [
		{ name: "crop is undefined" },
		{ name: "one of dimensions missing", crop: { x: 0, y: 0, w: 10 } },
		{
			name: "contains non-number values",
			crop: { x: 0 as any, y: 0, w: "10" as unknown as number, h: 10 },
		},
		{ name: "contains non-finite numbers", crop: { x: 0, y: 0, w: Number.POSITIVE_INFINITY, h: 10 } },
		{ name: "has zero or negative width", crop: { x: 0, y: 0, w: 0, h: 10 } },
		{ name: "has zero or negative height", crop: { x: 0, y: 0, w: 10, h: -1 } },
		{ name: "has negative x coordinate", crop: { x: -1, y: 0, w: 10, h: 10 } },
		{ name: "has negative y coordinate", crop: { x: 0, y: -5, w: 10, h: 10 } },
		{ name: "exceeds width boundary", crop: { x: 90, y: 0, w: 20, h: 10 } },
		{ name: "exceeds height boundary", crop: { x: 0, y: 95, w: 10, h: 10 } },
	];

	test.each(invalidCases)("returns false when %s", ({ crop }) => {
		expect(hasValidCrop(crop)).toBe(false);
	});
});
