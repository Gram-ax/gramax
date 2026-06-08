import Style from "@components/HomePage/Cards/model/Style";
import moveCardInKanban from "@ext/markdown/elements/view/render/logic/kanbanMoveCard";
import type { Property, ViewRenderData, ViewRenderGroup } from "@ext/properties/models";
import { PropertyTypes } from "@ext/properties/models";

const createArticle = (itemPath: string, status: string): ViewRenderData => ({
	title: `Article ${itemPath}`,
	linkPath: `/path/${itemPath}`,
	itemPath,
	resourcePath: `/res/${itemPath}`,
	otherProps: [
		{
			name: "status",
			type: PropertyTypes.enum,
			style: Style.blue,
			value: [status],
		} as Property,
	],
});

const createColumn = (name: string, articles: ViewRenderData[]): ViewRenderGroup => ({
	group: [name],
	articles,
	subgroups: [{ group: [name], articles }],
});

describe("moveCardInKanban", () => {
	const columnA = createColumn("A", [createArticle("article-1", "A"), createArticle("article-2", "A")]);
	const columnB = createColumn("B", [createArticle("article-3", "B")]);
	const initialData: ViewRenderGroup[] = [columnA, columnB];

	test("moves card between existing columns", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 0,
			cardID: 0,
			newColumnID: 1,
			groupbyProperty: "status",
		});

		expect(result.data).toHaveLength(2);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(1);
		expect(result.data[1].subgroups?.[0].articles).toHaveLength(2);
		expect(result.data[1].subgroups?.[0].articles[1].itemPath).toBe("article-1");
		expect(result.data[1].subgroups?.[0].articles[1].otherProps[0].value).toEqual(["B"]);
		expect(result.newValue).toBe("B");
		expect(result.isDelete).toBe(false);
	});

	test("moves card to column 0", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 1,
			cardID: 0,
			newColumnID: 0,
			groupbyProperty: "status",
		});

		expect(result.data).toHaveLength(2);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(3);
		expect(result.data[0].subgroups?.[0].articles[2].itemPath).toBe("article-3");
		expect(result.data[0].subgroups?.[0].articles[2].otherProps[0].value).toEqual(["A"]);
		expect(result.data[1].subgroups?.[0].articles).toHaveLength(0);
		expect(result.newValue).toBe("A");
		expect(result.isDelete).toBe(false);
	});

	test("moves last card to empty column 0", () => {
		const emptyColumnA = createColumn("A", []);
		const columnB = createColumn("B", [createArticle("article-3", "B")]);
		const data: ViewRenderGroup[] = [emptyColumnA, columnB];

		const result = moveCardInKanban({
			data,
			columnID: 1,
			cardID: 0,
			newColumnID: 0,
			groupbyProperty: "status",
		});

		expect(result.data).toHaveLength(2);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(1);
		expect(result.data[0].subgroups?.[0].articles[0].itemPath).toBe("article-3");
		expect(result.data[1].subgroups?.[0].articles).toHaveLength(0);
		expect(result.newValue).toBe("A");
	});

	test("creates new column when selecting a value without a column", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 0,
			cardID: 0,
			newColumnID: -1,
			groupbyProperty: "status",
			selectedValue: "C",
		});

		expect(result.data).toHaveLength(3);
		expect(result.data[2].group).toEqual(["C"]);
		expect(result.data[2].subgroups?.[0].articles).toHaveLength(1);
		expect(result.data[2].subgroups?.[0].articles[0].itemPath).toBe("article-1");
		expect(result.data[2].subgroups?.[0].articles[0].otherProps[0].value).toEqual(["C"]);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(1);
		expect(result.newValue).toBe("C");
		expect(result.isDelete).toBe(false);
	});

	test("does not create new column when selected value is filtered out", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 0,
			cardID: 0,
			newColumnID: -1,
			groupbyProperty: "status",
			defs: [{ id: "status", value: ["C"] }],
			selectedValue: "C",
		});

		expect(result.data).toHaveLength(2);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(1);
		expect(result.data[0].subgroups?.[0].articles[0].itemPath).toBe("article-2");
		expect(result.newValue).toBe("C");
		expect(result.isDelete).toBe(false);
		expect(result.isFilteredOut).toBe(true);
	});

	test("deletes card when isDelete is true", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 0,
			cardID: 0,
			newColumnID: -1,
			groupbyProperty: "status",
			isDelete: true,
		});

		expect(result.data).toHaveLength(2);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(1);
		expect(result.data[0].subgroups?.[0].articles[0].itemPath).toBe("article-2");
		expect(result.newValue).toBe("");
		expect(result.isDelete).toBe(true);
	});

	test("keeps empty column after moving last card", () => {
		const singleCardColumn = createColumn("A", [createArticle("article-1", "A")]);
		const data: ViewRenderGroup[] = [singleCardColumn, columnB];

		const result = moveCardInKanban({
			data,
			columnID: 0,
			cardID: 0,
			newColumnID: 1,
			groupbyProperty: "status",
		});

		expect(result.data).toHaveLength(2);
		expect(result.data[0].group).toEqual(["A"]);
		expect(result.data[0].subgroups?.[0].articles).toHaveLength(0);
		expect(result.data[1].group).toEqual(["B"]);
		expect(result.data[1].subgroups?.[0].articles).toHaveLength(2);
	});

	test("returns original data when columnID is invalid", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 99,
			cardID: 0,
			newColumnID: 1,
			groupbyProperty: "status",
		});

		expect(result.data).toEqual(initialData);
	});

	test("returns original data when cardID is invalid", () => {
		const result = moveCardInKanban({
			data: initialData,
			columnID: 0,
			cardID: 99,
			newColumnID: 1,
			groupbyProperty: "status",
		});

		expect(result.data).toEqual(initialData);
	});
});
