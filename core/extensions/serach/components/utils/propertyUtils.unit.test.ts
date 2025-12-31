import Style from "@components/HomePage/Cards/model/Style";
import { Property, PropertyTypes } from "@ext/properties/models";
import { cloneProperty, filterPropertiesBySearch, togglePropertyValue } from "./propertyUtils";

const baseProperty = (overrides?: Partial<Property>): Property => ({
	name: "color",
	type: PropertyTypes.enum,
	style: Style.red,
	values: ["red", "blue", "green"],
	value: [],
	...overrides,
});

describe("cloneProperty", () => {
	test("creates deep copy of values and value arrays", () => {
		const prop = baseProperty({ value: ["red"] });

		const cloned = cloneProperty(prop);

		expect(cloned).not.toBe(prop);
		expect(cloned.values).not.toBe(prop.values);
		expect(cloned.value).not.toBe(prop.value);
		expect(cloned).toEqual(prop);
	});

	test("handles missing arrays", () => {
		const prop: Property = {
			name: "flag",
			type: PropertyTypes.flag,
			style: Style.red,
		};

		const cloned = cloneProperty(prop);

		expect(cloned.values).toEqual([]);
		expect(cloned.value).toEqual([]);
	});
});

describe("togglePropertyValue", () => {
	const availableProperties = new Map<string, Property>([
		["color", baseProperty()],
		[
			"size",
			baseProperty({
				name: "size",
				values: ["s", "m", "l"],
			}),
		],
		[
			"flagProp",
			{
				name: "flagProp",
				type: PropertyTypes.flag,
				style: Style.red,
			},
		],
	]);

	test("adds property when not present", () => {
		const result = togglePropertyValue([], availableProperties, "color", "red");

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("color");
		expect(result[0].value).toEqual(["red"]);
	});

	test("adds value to existing property", () => {
		const props = [baseProperty({ value: ["red"] })];

		const result = togglePropertyValue(props, availableProperties, "color", "blue");

		expect(result[0].value).toEqual(["red", "blue"]);
	});

	test("removes value if already present", () => {
		const props = [baseProperty({ value: ["red", "blue"] })];

		const result = togglePropertyValue(props, availableProperties, "color", "red");

		expect(result[0].value).toEqual(["blue"]);
	});

	test("removes property if last value removed", () => {
		const props = [baseProperty({ value: ["red"] })];

		const result = togglePropertyValue(props, availableProperties, "color", "red");

		expect(result).toHaveLength(0);
	});

	test("removes flag property on toggle", () => {
		const props: Property[] = [
			{
				name: "flagProp",
				type: PropertyTypes.flag,
				style: {} as any,
			},
		];

		const result = togglePropertyValue(props, availableProperties, "flagProp");

		expect(result).toHaveLength(0);
	});

	test("adds flag property if missing", () => {
		const result = togglePropertyValue([], availableProperties, "flagProp");

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe(PropertyTypes.flag);
	});
});

describe("filterPropertiesBySearch", () => {
	const properties: Property[] = [
		{
			name: "color",
			type: PropertyTypes.enum,
			style: {} as any,
			values: ["red", "blue", "green"],
		},
		{
			name: "size",
			type: PropertyTypes.enum,
			style: {} as any,
			values: ["s", "m", "l"],
		},
	];

	test("returns all properties when no search", () => {
		const result = filterPropertiesBySearch(properties, "", new Map());

		expect(result.shownFilterableProperties.array).toHaveLength(2);
		expect(result.filterableProperties.array).toHaveLength(2);
	});

	test("filters properties by name", () => {
		const result = filterPropertiesBySearch(properties, "col", new Map());

		expect(result.shownFilterableProperties.array).toHaveLength(1);
		expect(result.shownFilterableProperties.array[0].name).toBe("color");
	});

	test("filters property values by value query", () => {
		const valueQueries = new Map<string, string>([["color", "re"]]);

		const result = filterPropertiesBySearch(properties, "", valueQueries);

		const color = result.shownFilterableProperties.map.get("color")!;
		expect(color.values).toEqual(["red", "green"]);
	});
});
