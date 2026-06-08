import Style from "@components/HomePage/Cards/model/Style";
import { useViewKanbanBoard } from "@ext/markdown/elements/view/render/logic/hooks/useViewKanbanBoard";
import type { Property, ViewRenderData, ViewRenderGroup } from "@ext/properties/models";
import { PropertyTypes } from "@ext/properties/models";
import { act, renderHook } from "@testing-library/react";

const createArticle = (itemPath: string, status: string, extraProps: Property[] = []): ViewRenderData => ({
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
		...extraProps,
	],
});

const createColumn = (name: string, articles: ViewRenderData[]): ViewRenderGroup => ({
	group: [name],
	articles,
	subgroups: [{ group: [name], articles }],
});

describe("useViewKanbanBoard", () => {
	const columnA = createColumn("A", [createArticle("article-1", "A"), createArticle("article-2", "A")]);
	const columnB = createColumn("B", [createArticle("article-3", "B")]);
	const initialData: ViewRenderGroup[] = [columnA, columnB];

	test("exposes data equal to initial content", () => {
		const { result } = renderHook(() =>
			useViewKanbanBoard({
				content: initialData,
				disabled: false,
				groupby: ["status"],
				defs: [],
				catalogProperties: undefined,
			}),
		);

		expect(result.current.data).toEqual(initialData);
	});

	test("onCardDrop does nothing when disabled", () => {
		const updateArticle = jest.fn();
		const { result } = renderHook(() =>
			useViewKanbanBoard({
				content: initialData,
				disabled: true,
				groupby: ["status"],
				defs: [],
				catalogProperties: undefined,
				updateArticle,
			}),
		);

		act(() => {
			result.current.onCardDrop(0, 0, 1);
		});

		expect(result.current.data).toEqual(initialData);
		expect(updateArticle).not.toHaveBeenCalled();
	});

	test("onCardDrop moves card between columns and calls updateArticle", () => {
		const updateArticle = jest.fn();
		const { result } = renderHook(() =>
			useViewKanbanBoard({
				content: initialData,
				disabled: false,
				groupby: ["status"],
				defs: [],
				catalogProperties: undefined,
				updateArticle,
			}),
		);

		act(() => {
			result.current.onCardDrop(0, 0, 1);
		});

		expect(updateArticle).toHaveBeenCalledWith("article-1", "status", "B", false);
		const col0 = result.current.data[0].subgroups![0].articles;
		const col1 = result.current.data[1].subgroups![0].articles;
		expect(col0).toHaveLength(1);
		expect(col0[0].itemPath).toBe("article-2");
		expect(col1.some((a) => a.itemPath === "article-1")).toBe(true);
	});

	test("updateHandler returns early when itemPath is not found", () => {
		const updateArticle = jest.fn();
		const { result } = renderHook(() =>
			useViewKanbanBoard({
				content: initialData,
				disabled: false,
				groupby: ["status"],
				defs: [],
				catalogProperties: undefined,
				updateArticle,
			}),
		);

		act(() => {
			result.current.updateHandler(0, "/missing", "status", "B");
		});

		expect(updateArticle).not.toHaveBeenCalled();
		expect(result.current.data).toEqual(initialData);
	});

	test("updateHandler with groupby property delegates to column move", () => {
		const updateArticle = jest.fn();
		const { result } = renderHook(() =>
			useViewKanbanBoard({
				content: initialData,
				disabled: false,
				groupby: ["status"],
				defs: [],
				catalogProperties: undefined,
				updateArticle,
			}),
		);

		act(() => {
			result.current.updateHandler(0, "article-1", "status", "B");
		});

		expect(updateArticle).toHaveBeenCalledWith("article-1", "status", "B", false);
		expect(result.current.data[1].subgroups![0].articles.some((a) => a.itemPath === "article-1")).toBe(true);
	});

	test("updateHandler updates non-groupby property when catalog has definition", () => {
		const labelProp: Property = {
			id: "label",
			name: "label",
			type: PropertyTypes.text,
			style: Style.blue,
		};
		const catalog = new Map<string, Property>([["label", labelProp]]);
		const articleWithLabel = createArticle("article-1", "A", [
			{ id: "label", name: "label", type: PropertyTypes.text, style: Style.blue, value: ["old"] } as Property,
		]);
		const dataWithLabel = [createColumn("A", [articleWithLabel, createArticle("article-2", "A")]), columnB];
		const updateArticle = jest.fn();

		const { result } = renderHook(() =>
			useViewKanbanBoard({
				content: dataWithLabel,
				disabled: false,
				groupby: ["status"],
				defs: [],
				catalogProperties: catalog,
				updateArticle,
			}),
		);

		act(() => {
			result.current.updateHandler(0, "article-1", "label", "new-label");
		});

		expect(updateArticle).toHaveBeenCalledWith("article-1", "label", "new-label", undefined);
		const label = result.current.data[0].subgroups![0].articles[0].otherProps.find((p) => p.name === "label");
		expect(label?.value).toEqual(["new-label"]);
	});

	test("resets data when content reference changes (useWatch)", () => {
		const { result, rerender } = renderHook(
			({ content }) =>
				useViewKanbanBoard({
					content,
					disabled: false,
					groupby: ["status"],
					defs: [],
					catalogProperties: undefined,
				}),
			{ initialProps: { content: initialData } },
		);

		act(() => {
			result.current.onCardDrop(0, 0, 1);
		});
		expect(result.current.data[1].subgroups![0].articles.some((a) => a.itemPath === "article-1")).toBe(true);

		const freshCopy: ViewRenderGroup[] = JSON.parse(JSON.stringify(initialData));
		rerender({ content: freshCopy });

		expect(result.current.data).toEqual(freshCopy);
	});
});
