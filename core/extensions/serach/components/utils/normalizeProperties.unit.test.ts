import Style from "@components/HomePage/Cards/model/Style";
import { type Property, PropertyTypes, type PropertyValue } from "@ext/properties/models";
import { normalizeArticleProperties, normalizeCatalogProperties } from "./normalizeProperties";

describe("normalizeCatalogProperties", () => {
	test("returns properties with id when id is already present", () => {
		const props: Property[] = [{ id: "color", name: "color", type: PropertyTypes.enum, style: Style.red }];

		const result = normalizeCatalogProperties(props);

		expect(result).toEqual([{ id: "color", name: "color", type: PropertyTypes.enum, style: Style.red }]);
	});

	test("fills id from name when id is missing", () => {
		const props = [{ name: "size", type: PropertyTypes.enum, style: Style.blue }] as Property[];

		const result = normalizeCatalogProperties(props);

		expect(result[0].id).toBe("size");
		expect(result[0].name).toBe("size");
	});

	test("handles null id explicitly", () => {
		const props = [
			{ id: null, name: "status", type: PropertyTypes.flag, style: Style.red },
		] as unknown as Property[];

		const result = normalizeCatalogProperties(props);

		expect(result[0].id).toBe("status");
	});

	test("returns empty array for empty input", () => {
		expect(normalizeCatalogProperties([])).toEqual([]);
	});

	test("returns undefined for nullish input", () => {
		expect(normalizeCatalogProperties(null)).toBeUndefined();
	});

	test("does not mutate original array", () => {
		const props = [{ name: "x", type: PropertyTypes.flag, style: Style.red }] as Property[];
		const result = normalizeCatalogProperties(props);

		expect(result[0]).not.toBe(props[0]);
		expect(props[0].id).toBeUndefined();
	});
});

describe("normalizeArticleProperties", () => {
	const catalogProperties: Property[] = [
		{ id: "color", name: "color", type: PropertyTypes.enum, style: Style.red, values: ["red", "blue"] },
		{ id: "priority", name: "priority", type: PropertyTypes.enum, style: Style.blue, values: ["high", "low"] },
		// biome-ignore lint/suspicious/noExplicitAny: expected
		{ name: "flag", type: PropertyTypes.flag, style: Style.green } as any,
	];

	test("returns property with catalog id and copied value", () => {
		const props: PropertyValue[] = [{ id: "color", value: ["red"] }];

		const result = normalizeArticleProperties(props, catalogProperties);

		expect(result).toEqual([{ id: "color", value: ["red"] }]);
	});

	test("fills id from legacy name field", () => {
		const props = [{ name: "color", value: ["blue"] }] as unknown as PropertyValue[];

		const result = normalizeArticleProperties(props, catalogProperties);

		expect(result[0].id).toBe("color");
		expect(result[0].value).toEqual(["blue"]);
	});

	test("preserves property not found in catalog with normalized id", () => {
		const props = [{ name: "unknown", value: ["x"] }] as unknown as PropertyValue[];

		const result = normalizeArticleProperties(props, catalogProperties);

		expect(result[0].id).toBe("unknown");
		expect(result[0].value).toEqual(["x"]);
	});

	test("creates copy of value array", () => {
		const originalValue = ["red"];
		const props: PropertyValue[] = [{ id: "color", value: originalValue }];

		const result = normalizeArticleProperties(props, catalogProperties);

		expect(result[0].value).not.toBe(originalValue);
		expect(result[0].value).toEqual(["red"]);
	});

	test("handles property with no value", () => {
		const props: PropertyValue[] = [{ id: "color" }];

		const result = normalizeArticleProperties(props, catalogProperties);

		expect(result[0].value).toEqual(undefined);
	});

	test("handles empty properties array", () => {
		expect(normalizeArticleProperties([], catalogProperties)).toEqual([]);
	});

	test("handles undefined value", () => {
		const props: PropertyValue[] = [{ id: "flag" }];

		const result = normalizeArticleProperties(props, catalogProperties);

		expect(result[0].value).toEqual(undefined);
	});
});
