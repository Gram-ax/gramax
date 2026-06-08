import Style from "@components/HomePage/Cards/model/Style";
import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";
import type { OrderValue, ProcessedArticle } from "@ext/properties/logic/ViewFilter";
import ViewSorter from "@ext/properties/logic/ViewSorter";
import { PropertyTypes, type ViewRenderGroup } from "@ext/properties/models";

class TestViewSorter extends ViewSorter {
	public sortGroup(groups: ViewRenderGroup[], orderby: OrderValue[], groupName: string) {
		return this._sortGroup(groups, orderby, groupName);
	}

	public sortArticle(articles: ProcessedArticle[], orderby: OrderValue[]) {
		return this._sortArticle(articles, orderby);
	}
}

describe("ViewSorter", () => {
	test("does not throw for legacy orderby entries without values when sorting groups", () => {
		const formatter = new AttributeFormatter();
		const orderby = formatter.parse({ orderby: "status=" }).orderby as OrderValue[];
		const sorter = new TestViewSorter();

		expect(() =>
			sorter.sortGroup(
				[
					{ group: ["B"], articles: [] },
					{ group: ["A"], articles: [] },
				],
				orderby,
				"status",
			),
		).not.toThrow();
	});

	test("falls back to catalog values when enum sorting has no explicit order", () => {
		const sorter = new TestViewSorter();

		expect(
			sorter
				.sortArticle(
					[
						{
							title: "A",
							resourcePath: "./a.md",
							linkPath: "/a",
							itemPath: "a",
							groupValues: [],
							otherProps: [
								{
									id: "status",
									name: "status",
									type: PropertyTypes.enum,
									style: Style.green,
									value: ["done"],
									values: ["todo", "done"],
								},
							],
						},
						{
							title: "B",
							resourcePath: "./b.md",
							linkPath: "/b",
							itemPath: "b",
							groupValues: [],
							otherProps: [
								{
									id: "status",
									name: "status",
									type: PropertyTypes.enum,
									style: Style.green,
									value: ["todo"],
									values: ["todo", "done"],
								},
							],
						},
					],
					[{ id: "status", value: undefined }],
				)
				.map((article) => article.title),
		).toEqual(["B", "A"]);
	});
});
