import { type Property, PropertyTypes } from "@ext/properties/models";
import { deleteProperty, updateProperty } from "./changeProperty";

const makeProperty = (id: string, type: PropertyTypes, value?: string[]): Property =>
	// biome-ignore lint/suspicious/noExplicitAny: expected
	({ id, name: id, type, style: {} as any, value }) as Property;

const makeCatalogMap = (...props: Property[]): Map<string, Property> => {
	const map = new Map<string, Property>();
	props.forEach((p) => map.set(p.id, p));
	return map;
};

describe("deleteProperty", () => {
	test("removes property by id", () => {
		const props = [makeProperty("a", PropertyTypes.text, ["x"]), makeProperty("b", PropertyTypes.text, ["y"])];
		const result = deleteProperty("a", props);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ id: "b", value: ["y"] });
	});

	test("returns full properties when returnFull is true", () => {
		const props = [makeProperty("a", PropertyTypes.text, ["x"]), makeProperty("b", PropertyTypes.text, ["y"])];
		const result = deleteProperty("a", props, true);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(props[1]);
	});

	test("returns empty array when deleting the only property", () => {
		const props = [makeProperty("a", PropertyTypes.flag)];
		const result = deleteProperty("a", props);
		expect(result).toHaveLength(0);
	});
});

describe("updateProperty", () => {
	describe("guard clauses", () => {
		test("returns undefined for unknown property", () => {
			const catalog = makeCatalogMap(makeProperty("a", PropertyTypes.text));
			const result = updateProperty("unknown", "val", catalog, []);
			expect(result).toBeUndefined();
		});

		test("returns undefined when hasValue type gets undefined value", () => {
			const catalog = makeCatalogMap(makeProperty("a", PropertyTypes.enum));
			const result = updateProperty("a", undefined, catalog, []);
			expect(result).toBeUndefined();
		});
	});

	describe("adding new property", () => {
		test("adds enum property with value", () => {
			const catalog = makeCatalogMap(makeProperty("a", PropertyTypes.enum));
			const result = updateProperty("a", "opt1", catalog, []);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "a", value: ["opt1"] });
		});

		test("adds flag property without value", () => {
			const catalog = makeCatalogMap(makeProperty("a", PropertyTypes.flag));
			const result = updateProperty("a", undefined, catalog, []);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "a" });
		});

		test("adds text property with value", () => {
			const catalog = makeCatalogMap(makeProperty("a", PropertyTypes.text));
			const result = updateProperty("a", "hello", catalog, []);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "a", value: ["hello"] });
		});
	});

	describe("Flag toggle", () => {
		test("removes flag when it already exists", () => {
			const catalog = makeCatalogMap(makeProperty("flag1", PropertyTypes.flag));
			const existing = [makeProperty("flag1", PropertyTypes.flag)];
			const result = updateProperty("flag1", undefined, catalog, existing);
			expect(result).toHaveLength(0);
		});
	});

	describe("Enum toggle", () => {
		test("removes enum when same value is selected", () => {
			const catalog = makeCatalogMap(makeProperty("e", PropertyTypes.enum));
			const existing = [makeProperty("e", PropertyTypes.enum, ["opt1"])];
			const result = updateProperty("e", "opt1", catalog, existing);
			expect(result).toHaveLength(0);
		});

		test("updates enum when different value is selected", () => {
			const catalog = makeCatalogMap(makeProperty("e", PropertyTypes.enum));
			const existing = [makeProperty("e", PropertyTypes.enum, ["opt1"])];
			const result = updateProperty("e", "opt2", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "e", value: ["opt2"] });
		});
	});

	describe("Text property", () => {
		test("updates text value", () => {
			const catalog = makeCatalogMap(makeProperty("t", PropertyTypes.text));
			const existing = [makeProperty("t", PropertyTypes.text, ["old"])];
			const result = updateProperty("t", "new", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "t", value: ["new"] });
		});

		test("keeps text when same value is set (no toggle)", () => {
			const catalog = makeCatalogMap(makeProperty("t", PropertyTypes.text));
			const existing = [makeProperty("t", PropertyTypes.text, ["same"])];
			const result = updateProperty("t", "same", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "t", value: ["same"] });
		});
	});

	describe("Date property", () => {
		test("keeps date when same value is set (no toggle)", () => {
			const catalog = makeCatalogMap(makeProperty("d", PropertyTypes.date));
			const existing = [makeProperty("d", PropertyTypes.date, ["2026-01-01"])];
			const result = updateProperty("d", "2026-01-01", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "d", value: ["2026-01-01"] });
		});
	});

	describe("Numeric property", () => {
		test("keeps numeric when same value is set (no toggle)", () => {
			const catalog = makeCatalogMap(makeProperty("n", PropertyTypes.numeric));
			const existing = [makeProperty("n", PropertyTypes.numeric, ["42"])];
			const result = updateProperty("n", "42", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: "n", value: ["42"] });
		});
	});

	describe("Many (multi-select) property", () => {
		test("adds value to existing many property", () => {
			const catalog = makeCatalogMap(makeProperty("m", PropertyTypes.many));
			const existing = [makeProperty("m", PropertyTypes.many, ["v1"])];
			const result = updateProperty("m", "v2", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0].value).toEqual(["v1", "v2"]);
		});

		test("removes value from many property (toggle off)", () => {
			const catalog = makeCatalogMap(makeProperty("m", PropertyTypes.many));
			const existing = [makeProperty("m", PropertyTypes.many, ["v1", "v2"])];
			const result = updateProperty("m", "v1", catalog, existing);
			expect(result).toHaveLength(1);
			expect(result[0].value).toEqual(["v2"]);
		});

		test("removes many property entirely when last value toggled off", () => {
			const catalog = makeCatalogMap(makeProperty("m", PropertyTypes.many));
			const existing = [makeProperty("m", PropertyTypes.many, ["v1"])];
			const result = updateProperty("m", "v1", catalog, existing);
			expect(result).toHaveLength(0);
		});
	});

	describe("sorting", () => {
		test("result is sorted by catalog property order", () => {
			const catalog = makeCatalogMap(
				makeProperty("a", PropertyTypes.flag),
				makeProperty("b", PropertyTypes.enum),
				makeProperty("c", PropertyTypes.text),
			);
			const existing = [makeProperty("c", PropertyTypes.text, ["x"]), makeProperty("a", PropertyTypes.flag)];
			const result = updateProperty("b", "val", catalog, existing);
			expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
		});
	});

	describe("returnFull mode", () => {
		test("returns full Property objects when returnFull is true", () => {
			const prop = makeProperty("a", PropertyTypes.enum);
			const catalog = makeCatalogMap(prop);
			const result = updateProperty("a", "val", catalog, [], true);
			expect(result).toHaveLength(1);
			expect(result[0].type).toBe(PropertyTypes.enum);
			expect(result[0].value).toEqual(["val"]);
		});
	});
});
