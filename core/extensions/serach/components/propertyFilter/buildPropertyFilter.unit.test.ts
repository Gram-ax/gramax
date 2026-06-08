import type Style from "@components/HomePage/Cards/model/Style";
import type { Property } from "@ext/properties/models";
import { PropertyTypes } from "@ext/properties/models";
import type { PropertyFilter } from "@ext/serach/Searcher";
import { buildPropertyFilter } from "./buildPropertyFilter";
import { type FilterablePropertyItem, flagPropertyValues, getPropertyFilterValues } from "./propertyFilterModel";

const makeProperty = (override: Partial<Property> & Pick<Property, "name" | "type">): Property => {
	return {
		id: override.name,
		name: override.name,
		type: override.type,
		style: (override as Property).style ?? ({} as Style),
		values: override.values,
		icon: override.icon,
		options: override.options,
		value: override.value,
	};
};

const makeItem = (args: {
	property: Property;
	selectedValues?: string[];
	emptySelected?: boolean;
}): FilterablePropertyItem => {
	const selected = new Set(args.selectedValues ?? []);
	const values = getPropertyFilterValues(args.property);
	const emptySelected = args.emptySelected ?? false;

	return {
		property: args.property,
		selection: {
			options: values.map((value) => ({ value, selected: selected.has(value) })),
			emptySelected,
			allSelected: emptySelected && values.every((v) => selected.has(v)),
		},
	};
};

describe("buildPropertyFilter", () => {
	it("returns undefined when there are no filtered properties", () => {
		expect(buildPropertyFilter([])).toBeUndefined();
	});

	describe("list / enum-like properties", () => {
		const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });

		it("returns contains when only values are selected", () => {
			const item = makeItem({ property: status, selectedValues: ["a"], emptySelected: false });
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [{ op: "contains", key: "status", list: ["a"] }],
			} satisfies PropertyFilter);
		});

		it("returns isEmpty when only empty is selected", () => {
			const item = makeItem({ property: status, selectedValues: [], emptySelected: true });
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [{ op: "isEmpty", key: "status" }],
			} satisfies PropertyFilter);
		});

		it("returns or(contains, isEmpty) when values and empty are selected", () => {
			const item = makeItem({ property: status, selectedValues: ["a", "b"], emptySelected: true });
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [
					{
						op: "or",
						filters: [
							{ op: "contains", key: "status", list: ["a", "b"] },
							{ op: "isEmpty", key: "status" },
						],
					},
				],
			} satisfies PropertyFilter);
		});

		it("returns contains with empty list when nothing is selected and empty is off", () => {
			const item = makeItem({ property: status, selectedValues: [], emptySelected: false });
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [{ op: "contains", key: "status", list: [] }],
			} satisfies PropertyFilter);
		});
	});

	describe("flag properties", () => {
		const done = makeProperty({ name: "done", type: PropertyTypes.flag });

		it("returns eq true when flag value is selected and empty is off", () => {
			const item = makeItem({
				property: done,
				selectedValues: [flagPropertyValues.selected],
				emptySelected: false,
			});
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [{ op: "eq", key: "done", value: true }],
			} satisfies PropertyFilter);
		});

		it("returns isEmpty when only empty is selected", () => {
			const item = makeItem({ property: done, selectedValues: [], emptySelected: true });
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [{ op: "isEmpty", key: "done" }],
			} satisfies PropertyFilter);
		});

		it("returns or(eq, isEmpty) when flag and empty are both selected", () => {
			const item = makeItem({
				property: done,
				selectedValues: [flagPropertyValues.selected],
				emptySelected: true,
			});
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [
					{
						op: "or",
						filters: [
							{ op: "eq", key: "done", value: true },
							{ op: "isEmpty", key: "done" },
						],
					},
				],
			} satisfies PropertyFilter);
		});

		it("returns eq true when flag is not selected and empty is off", () => {
			const item = makeItem({ property: done, selectedValues: [], emptySelected: false });
			expect(buildPropertyFilter([item])).toEqual({
				op: "and",
				filters: [{ op: "eq", key: "done", value: true }],
			} satisfies PropertyFilter);
		});
	});

	it("combines multiple properties with top-level and", () => {
		const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["x"] });
		const done = makeProperty({ name: "done", type: PropertyTypes.flag });

		const items = [
			makeItem({ property: status, selectedValues: ["x"], emptySelected: false }),
			makeItem({
				property: done,
				selectedValues: [flagPropertyValues.selected],
				emptySelected: false,
			}),
		];

		expect(buildPropertyFilter(items)).toEqual({
			op: "and",
			filters: [
				{ op: "contains", key: "status", list: ["x"] },
				{ op: "eq", key: "done", value: true },
			],
		} satisfies PropertyFilter);
	});
});
