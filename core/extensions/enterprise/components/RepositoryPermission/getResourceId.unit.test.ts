import { getResourceId } from "./getResourceId";

describe("getResourceId", () => {
	test("strips source prefix and returns group/catalog", () => {
		expect(getResourceId("gitlab.ics-it.ru/ics/docs", "gitlab.ics-it.ru", "docs")).toEqual("ics/docs");
	});

	test("cuts trailing path after the catalog segment", () => {
		expect(getResourceId("gitlab.ics-it.ru/ics/docs/-/tree/main", "gitlab.ics-it.ru", "docs")).toEqual("ics/docs");
	});

	test("keeps nested groups before the catalog", () => {
		expect(getResourceId("gitlab.ics-it.ru/group/subgroup/docs", "gitlab.ics-it.ru", "docs")).toEqual(
			"group/subgroup/docs",
		);
	});

	test("uses path as is when it has no source prefix", () => {
		expect(getResourceId("ics/docs", "gitlab.ics-it.ru", "docs")).toEqual("ics/docs");
	});

	test("returns path without source when catalog segment is absent", () => {
		expect(getResourceId("gitlab.ics-it.ru/ics/other", "gitlab.ics-it.ru", "docs")).toEqual("ics/other");
	});

	test("ignores empty segments from duplicate and trailing slashes", () => {
		expect(getResourceId("gitlab.ics-it.ru/ics//docs/", "gitlab.ics-it.ru", "docs")).toEqual("ics/docs");
	});

	test("cuts at the first occurrence when a group is named like the catalog", () => {
		expect(getResourceId("gitlab.ics-it.ru/docs/docs", "gitlab.ics-it.ru", "docs")).toEqual("docs");
	});
});
