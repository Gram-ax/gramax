/** biome-ignore-all lint/style/useNamingConvention: test reaches ViewFilter private members (_group, _catalogPropMap) */
import t from "@ext/localization/locale/translate";
import ViewFilter, { type ProcessedArticle } from "@ext/properties/logic/ViewFilter";
import { type Property, PropertyTypes, type ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";

const makeFilter = (groupby: string[], catalogProps: Property[], display: Display = Display.List): ViewFilter => {
	const filter = new ViewFilter([], [], groupby, [], [], null, null, display, [], null, null, null);
	// _catalogPropMap is normally built in _filter(); set it directly for a pure grouping unit test.
	(filter as unknown as { _catalogPropMap: Map<string, Property> })._catalogPropMap = new Map(
		catalogProps.map((prop) => [prop.id, prop]),
	);
	return filter;
};

const groupOf = (filter: ViewFilter, articles: ProcessedArticle[]): ViewRenderGroup[] =>
	(filter as unknown as { _group: (a: ProcessedArticle[]) => ViewRenderGroup[] })._group(articles);

const article = (itemPath: string, groupValues: (string | string[])[]): ProcessedArticle => ({
	title: itemPath,
	resourcePath: itemPath,
	linkPath: itemPath,
	itemPath,
	otherProps: [],
	groupValues,
});

describe("ViewFilter grouping by Flag property (#868)", () => {
	const flagProp = { id: "Done", name: "Done", type: PropertyTypes.flag, values: null } as Property;

	test("article with the flag set is grouped under 'Yes'", () => {
		const filter = makeFilter(["Done"], [flagProp]);
		// A set flag stores no value, so _proccessArticle yields the property id as the group value.
		const groups = groupOf(filter, [article("with-flag.md", ["Done"])]);

		const keys = groups.map((g) => g.group?.[0]);
		expect(keys).toContain(t("yes"));
		expect(keys).not.toContain(t("no"));
	});

	test("article without the flag is grouped under 'No'", () => {
		const filter = makeFilter(["Done"], [flagProp]);
		const groups = groupOf(filter, [article("no-flag.md", [null])]);

		const keys = groups.map((g) => g.group?.[0]);
		expect(keys).toContain(t("no"));
		expect(keys).not.toContain(t("yes"));
	});
});
