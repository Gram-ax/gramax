import type Style from "@components/HomePage/Cards/model/Style";
import type { Property } from "@ext/properties/models";
import { PropertyTypes } from "@ext/properties/models";
import {
	buildFilterableProperties,
	type FilterablePropertyItem,
	flagPropertyValues,
	getPropertyFilterValues,
	getPropertyValueLabel,
	getSelectedValues,
	selectAllFilterablePropertyValues,
	selectEmptyFilterablePropertyValue,
	toggleFilterablePropertyValue,
} from "./propertyFilterModel";

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

const makeAvailableMap = (properties: Property[]): Map<string, Property> => {
	return new Map(properties.map((p) => [p.name, p]));
};

const makeSelectedItem = (args: {
	property: Property;
	selectedValues?: string[];
	emptySelected?: boolean;
}): FilterablePropertyItem => {
	const selectedValues = new Set(args.selectedValues ?? []);
	const values = getPropertyFilterValues(args.property);
	const emptySelected = args.emptySelected ?? false;

	return {
		property: args.property,
		selection: {
			options: values.map((value) => ({ value, selected: selectedValues.has(value) })),
			emptySelected,
			allSelected: emptySelected && values.every((v) => selectedValues.has(v)),
		},
	};
};

describe("propertyFilterModel", () => {
	describe("getPropertyValueLabel", () => {
		it.each([
			{
				title: "returns translated label for Flag:selected",
				type: PropertyTypes.flag,
				value: flagPropertyValues.selected,
				expected: "(selected)",
			},
			{
				title: "returns raw value for non-flag types",
				type: PropertyTypes.enum,
				value: flagPropertyValues.selected,
				expected: flagPropertyValues.selected,
			},
			{
				title: "returns raw value for Flag when value is not 'selected'",
				type: PropertyTypes.flag,
				value: "anything",
				expected: "anything",
			},
		])("$title", ({ type, value, expected }) => {
			expect(getPropertyValueLabel(type, value)).toBe(expected);
		});
	});

	describe("getPropertyFilterValues", () => {
		it("returns special value list for flag property", () => {
			const property = makeProperty({ name: "isDone", type: PropertyTypes.flag, values: ["ignored"] });
			expect(getPropertyFilterValues(property)).toEqual([flagPropertyValues.selected]);
		});

		it("returns provided values for non-flag property", () => {
			const property = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			expect(getPropertyFilterValues(property)).toEqual(["a", "b"]);
		});

		it("returns empty list when values are missing", () => {
			const property = makeProperty({ name: "status", type: PropertyTypes.enum });
			expect(getPropertyFilterValues(property)).toEqual([]);
		});
	});

	describe("buildFilterableProperties", () => {
		it("builds full and shown collections (with property query and values query)", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["Open", "Closed"] });
			const priority = makeProperty({ name: "priority", type: PropertyTypes.enum, values: ["High", "Low"] });

			const selected: FilterablePropertyItem[] = [
				makeSelectedItem({ property: status, selectedValues: ["Closed"], emptySelected: false }),
			];

			const result = buildFilterableProperties(
				[status, priority],
				selected,
				"sta", // already lowercase; implementation expects lowercase compare
				new Map<string, string>([["status", "clo"]]),
			);

			expect(result.filterableProperties.array.map((x) => x.property.name)).toEqual(["status", "priority"]);
			expect(result.filterableProperties.map.get("status")?.selection.options).toEqual([
				{ value: "Open", selected: false },
				{ value: "Closed", selected: true },
			]);

			// shown list is filtered by propertyQuery and per-property values query
			expect(result.shownFilterableProperties.array.map((x) => x.property.name)).toEqual(["status"]);
			expect(result.shownFilterableProperties.map.get("status")?.selection.options).toEqual([
				{ value: "Closed", selected: true },
			]);
		});

		it("returns all properties in shown list when propertyQuery is empty", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["Open", "Closed"] });
			const priority = makeProperty({ name: "priority", type: PropertyTypes.enum, values: ["High", "Low"] });

			const result = buildFilterableProperties([status, priority], [], "", new Map());

			expect(result.shownFilterableProperties.array.map((x) => x.property.name)).toEqual(["status", "priority"]);
			expect([...result.shownFilterableProperties.map.keys()]).toEqual(["status", "priority"]);
		});

		it("filters only by property name substring (lowercase compare)", () => {
			const status = makeProperty({ name: "Status", type: PropertyTypes.enum, values: ["a"] });
			const priority = makeProperty({ name: "priority", type: PropertyTypes.enum, values: ["b"] });

			const result = buildFilterableProperties([status, priority], [], "sta", new Map());

			expect(result.shownFilterableProperties.array.map((x) => x.property.name)).toEqual(["Status"]);
			const result2 = buildFilterableProperties([status, priority], [], "prio", new Map());
			expect(result2.shownFilterableProperties.array.map((x) => x.property.name)).toEqual(["priority"]);
		});

		it("does not filter values when propertyValuesQueries has no entry for property", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["Open", "Closed"] });

			const result = buildFilterableProperties([status], [], "", new Map([["other", "clo"]]));

			expect(result.shownFilterableProperties.map.get("status")?.selection.options).toEqual([
				{ value: "Open", selected: false },
				{ value: "Closed", selected: false },
			]);
		});

		it("filters shown values per propertyValuesQueries and keeps selection for remaining options", () => {
			const status = makeProperty({
				name: "status",
				type: PropertyTypes.enum,
				values: ["Open", "Closed", "In Progress"],
			});
			const priority = makeProperty({ name: "priority", type: PropertyTypes.enum, values: ["High", "Low"] });

			const selected: FilterablePropertyItem[] = [
				makeSelectedItem({ property: status, selectedValues: ["Closed", "In Progress"], emptySelected: false }),
			];

			const result = buildFilterableProperties(
				[status, priority],
				selected,
				"",
				new Map<string, string>([["status", "pro"]]),
			);

			// Full list keeps all values
			expect(result.filterableProperties.map.get("status")?.selection.options).toEqual([
				{ value: "Open", selected: false },
				{ value: "Closed", selected: true },
				{ value: "In Progress", selected: true },
			]);

			// Shown list filters values for "status" only
			expect(result.shownFilterableProperties.map.get("status")?.selection.options).toEqual([
				{ value: "In Progress", selected: true },
			]);
			expect(result.shownFilterableProperties.map.get("priority")?.selection.options).toEqual([
				{ value: "High", selected: false },
				{ value: "Low", selected: false },
			]);
		});

		it("preserves emptySelected and allSelected computed from previous selection", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			const selected: FilterablePropertyItem[] = [
				makeSelectedItem({ property: status, selectedValues: ["a", "b"], emptySelected: true }),
			];

			const result = buildFilterableProperties([status], selected, "", new Map());
			const item = result.filterableProperties.map.get("status");

			expect(item?.selection.emptySelected).toBe(true);
			expect(item?.selection.allSelected).toBe(true);
			expect(getSelectedValues(item).sort()).toEqual(["a", "b"]);
		});
	});

	describe("toggle/select helpers", () => {
		it("getSelectedValues returns empty array for undefined item", () => {
			expect(getSelectedValues(undefined)).toEqual([]);
		});

		it("toggleFilterablePropertyValue toggles selection for a value", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			const available = makeAvailableMap([status]);

			const current: FilterablePropertyItem[] = [makeSelectedItem({ property: status, selectedValues: ["a"] })];
			const next = toggleFilterablePropertyValue(current, available, "status", "b");

			expect(next).toHaveLength(1);
			expect(getSelectedValues(next[0]).sort()).toEqual(["a", "b"]);
			expect(next[0].selection.allSelected).toBe("indeterminate");
			expect(next[0].selection.emptySelected).toBe(false);
		});

		it("toggleFilterablePropertyValue keeps current selection when value is undefined", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			const available = makeAvailableMap([status]);

			const current: FilterablePropertyItem[] = [
				makeSelectedItem({ property: status, selectedValues: ["a"], emptySelected: true }),
			];
			const next = toggleFilterablePropertyValue(current, available, "status");

			expect(next).toHaveLength(1);
			expect(getSelectedValues(next[0])).toEqual(["a"]);
			expect(next[0].selection.emptySelected).toBe(true);
		});

		it("toggleFilterablePropertyValue removes item when last selection is cleared", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			const available = makeAvailableMap([status]);

			const current: FilterablePropertyItem[] = [makeSelectedItem({ property: status, selectedValues: ["a"] })];
			const next = toggleFilterablePropertyValue(current, available, "status", "a");

			expect(next).toEqual([]);
		});

		it("selectAllFilterablePropertyValues selects everything (and empty) and then clears everything on second call", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			const available = makeAvailableMap([status]);

			const first = selectAllFilterablePropertyValues([], available, "status");
			expect(first).toHaveLength(1);
			expect(first[0].selection.emptySelected).toBe(true);
			expect(first[0].selection.allSelected).toBe(true);
			expect(getSelectedValues(first[0]).sort()).toEqual(["a", "b"]);

			const second = selectAllFilterablePropertyValues(first, available, "status");
			expect(second).toEqual([]);
		});

		it("selectEmptyFilterablePropertyValue toggles emptySelected and keeps item even if no values are selected", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a", "b"] });
			const available = makeAvailableMap([status]);

			const first = selectEmptyFilterablePropertyValue([], available, "status");
			expect(first).toHaveLength(1);
			expect(first[0].selection.emptySelected).toBe(true);
			expect(first[0].selection.allSelected).toBe("indeterminate");
			expect(getSelectedValues(first[0])).toEqual([]);

			const second = selectEmptyFilterablePropertyValue(first, available, "status");
			expect(second).toEqual([]);
		});

		it("returns original array when property is missing from availableProperties", () => {
			const available = makeAvailableMap([]);

			const current: FilterablePropertyItem[] = [];
			expect(toggleFilterablePropertyValue(current, available, "status", "a")).toBe(current);
		});

		it("keeps filteredProperties ordered by availableProperties (stable order)", () => {
			const status = makeProperty({ name: "status", type: PropertyTypes.enum, values: ["a"] });
			const priority = makeProperty({ name: "priority", type: PropertyTypes.enum, values: ["b"] });
			const owner = makeProperty({ name: "owner", type: PropertyTypes.enum, values: ["c"] });
			const available = makeAvailableMap([status, priority, owner]);

			let current: FilterablePropertyItem[] = [];
			current = toggleFilterablePropertyValue(current, available, "priority", "b");
			current = toggleFilterablePropertyValue(current, available, "status", "a");
			current = toggleFilterablePropertyValue(current, available, "owner", "c");

			expect(current.map((x) => x.property.name)).toEqual(["status", "priority", "owner"]);

			// toggling middle property again should not move it to the end
			current = toggleFilterablePropertyValue(current, available, "priority", "b");
			current = toggleFilterablePropertyValue(current, available, "priority", "b");
			expect(current.map((x) => x.property.name)).toEqual(["status", "priority", "owner"]);
		});
	});
});
