import { useSearchResults } from "@ext/serach/components/useSearchResults";
import type { SearchResult } from "@ext/serach/Searcher";
import type { FocusItem } from "@ext/serach/utils/FocusItemsCollector";
import { buildArticleRows, type RowSearchResult } from "@ext/serach/utils/SearchRowsModel";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

const makeArticle = (url: string, paragraphs: string[]): SearchResult => ({
	type: "article",
	url,
	title: [{ type: "text", text: url }],
	refPath: url,
	properties: [],
	breadcrumbs: [],
	isRecommended: false,
	catalog: { name: "c", title: "C", url: "/c" },
	items: paragraphs.map((text) => ({
		type: "paragraph",
		searchText: text,
		items: [{ type: "text", text }],
	})),
});

const makeDiagramArticle = (url: string, paragraphs: string[]): SearchResult => ({
	type: "article",
	url,
	title: [{ type: "text", text: url }],
	refPath: url,
	properties: [],
	breadcrumbs: [],
	isRecommended: false,
	catalog: { name: "c", title: "C", url: "/c" },
	items: [
		{
			type: "diagram",
			diagramType: "mermaid",
			title: [{ type: "text", text: "Diagram" }],
			items: paragraphs.map((text) => ({
				type: "paragraph",
				searchText: text,
				items: [{ type: "text", text }],
			})),
		},
	],
});

const makeFileBlockArticleWithTwoExpandableGroups = (url: string): SearchResult => ({
	type: "article",
	url,
	title: [{ type: "text", text: url }],
	refPath: url,
	properties: [],
	breadcrumbs: [],
	isRecommended: false,
	catalog: { name: "c", title: "C", url: "/c" },
	items: [
		{
			type: "block",
			title: [{ type: "text", text: "src/file.ts" }],
			embeddedLinkTitle: [{ type: "text", text: "src/file.ts" }],
			items: [
				{ type: "paragraph", searchText: "g1 p1", items: [{ type: "text", text: "g1 p1" }] },
				{ type: "paragraph", searchText: "g1 p2", items: [{ type: "text", text: "g1 p2" }] },
				{ type: "paragraph", searchText: "g1 p3", items: [{ type: "text", text: "g1 p3" }] },
				{ type: "paragraph", searchText: "g1 p4", items: [{ type: "text", text: "g1 p4" }] },
				{ type: "paragraph", searchText: "g1 p5", items: [{ type: "text", text: "g1 p5" }] },
				{
					type: "diagram",
					diagramType: "mermaid",
					title: [{ type: "text", text: "splitter diagram" }],
					items: [{ type: "paragraph", searchText: "d1", items: [{ type: "text", text: "d1" }] }],
				},
				{ type: "paragraph", searchText: "g2 p1", items: [{ type: "text", text: "g2 p1" }] },
				{ type: "paragraph", searchText: "g2 p2", items: [{ type: "text", text: "g2 p2" }] },
				{ type: "paragraph", searchText: "g2 p3", items: [{ type: "text", text: "g2 p3" }] },
				{ type: "paragraph", searchText: "g2 p4", items: [{ type: "text", text: "g2 p4" }] },
				{ type: "paragraph", searchText: "g2 p5", items: [{ type: "text", text: "g2 p5" }] },
			],
		},
	],
});

const buildRows = (results: SearchResult[]): RowSearchResult[] => buildArticleRows(results).rows;

const useTestHook = (rows: RowSearchResult[]) => {
	const [focusItem, setFocusItem] = useState<FocusItem | undefined>(undefined);
	const result = useSearchResults({
		rows,
		focusItem,
		setFocusItem,
		onLinkOpen: jest.fn(),
	});
	return { ...result, focusItem };
};

const findExpander = (items: unknown[]): { id: string; expand: () => void } | undefined => {
	for (const item of items as Array<{ type: string; id: string; expand?: () => void; children?: unknown[] }>) {
		if (item.type === "expander") return { id: item.id, expand: item.expand! };
		if (item.children) {
			const res = findExpander(item.children);
			if (res) return res;
		}
	}
	return undefined;
};

const findExpanders = (items: unknown[]): Array<{ id: string; expand: () => void }> => {
	const expanders: Array<{ id: string; expand: () => void }> = [];
	for (const item of items as Array<{ type: string; id: string; expand?: () => void; children?: unknown[] }>) {
		if (item.type === "expander") expanders.push({ id: item.id, expand: item.expand! });
		if (item.children) expanders.push(...findExpanders(item.children));
	}
	return expanders;
};

describe("useSearchResults", () => {
	describe("focus movement (arrow keys and mouse hover)", () => {
		test("arrow down from empty focus sets focus to the first focusable item", () => {
			const rows = buildRows([makeArticle("/a", ["p1", "p2"]), makeArticle("/b", ["p1"])]);
			const { result } = renderHook(() => useTestHook(rows));

			act(() => result.current.focus.move(1));

			expect(result.current.focus.current?.id).toBe(rows[0].id);
		});

		test("arrow down moves focus to the next focusable item and arrow up moves it back", () => {
			const rows = buildRows([makeArticle("/a", ["p1", "p2"])]);
			const { result } = renderHook(() => useTestHook(rows));

			act(() => result.current.focus.move(1));
			act(() => result.current.focus.move(1));
			const secondId = result.current.focus.current?.id;
			act(() => result.current.focus.move(-1));

			expect(secondId).not.toBe(rows[0].id);
			expect(result.current.focus.current?.id).toBe(rows[0].id);
		});

		test("focus.set by id focuses the hovered item (mouse hover)", () => {
			const rows = buildRows([makeArticle("/a", ["p1"]), makeArticle("/b", ["p1"])]);
			const { result } = renderHook(() => useTestHook(rows));

			act(() => result.current.focus.set(rows[1].id));

			expect(result.current.focus.current?.id).toBe(rows[1].id);
		});
	});

	describe("expander", () => {
		test("shows only the first 3 paragraphs and an expander when there are more", () => {
			const rows = buildRows([makeArticle("/a", ["p1", "p2", "p3", "p4", "p5"])]);
			const { result } = renderHook(() => useTestHook(rows));

			const articleRow = result.current.results[0] as { items: Array<{ type: string; count?: number }> };
			const types = articleRow.items.map((i) => i.type);

			expect(types).toEqual(["link", "link", "link", "expander"]);
			expect(articleRow.items[3]).toMatchObject({ type: "expander", count: 2 });
		});

		test("clicking the expander reveals hidden paragraphs", () => {
			const rows = buildRows([makeArticle("/a", ["p1", "p2", "p3", "p4", "p5"])]);
			const { result } = renderHook(() => useTestHook(rows));

			const expander = findExpander((result.current.results[0] as { items: unknown[] }).items)!;
			act(() => expander.expand());

			const articleRow = result.current.results[0] as { items: Array<{ type: string }> };
			expect(articleRow.items.map((i) => i.type)).toEqual(["link", "link", "link", "link", "link"]);
		});

		test("after expand, focus moves to the last newly revealed paragraph", () => {
			const rows = buildRows([makeArticle("/a", ["p1", "p2", "p3", "p4", "p5"])]);
			const { result } = renderHook(() => useTestHook(rows));

			const lastParagraphId = (result.current.results[0] as { items: Array<{ id: string }> }).items[2].id;
			const expander = findExpander((result.current.results[0] as { items: unknown[] }).items)!;

			act(() => expander.expand());

			const lastVisibleId = (result.current.results[0] as { items: Array<{ id: string }> }).items[4].id;
			expect(result.current.focus.current?.id).toBe(lastVisibleId);
			expect(result.current.focus.current?.id).not.toBe(lastParagraphId);
		});

		test("when last expanded item is not focusable (diagram), focus goes to temp state and next arrow moves from expander position", () => {
			const rows = buildRows([makeDiagramArticle("/a", ["p1", "p2", "p3", "p4", "p5"])]);
			const { result } = renderHook(() => useTestHook(rows));

			const expander = findExpander((result.current.results[0] as { items: unknown[] }).items)!;
			act(() => expander.expand());

			expect(result.current.focus.current?.type).toBe("temp");

			act(() => result.current.focus.move(1));
			expect(result.current.focus.current?.type).not.toBe("temp");
		});

		test("uses unique expander ids for multiple expanders in same file-block", () => {
			const rows = buildRows([makeFileBlockArticleWithTwoExpandableGroups("/a")]);
			const { result } = renderHook(() => useTestHook(rows));

			const articleRow = result.current.results[0] as { items: unknown[] };
			const expanders = findExpanders(articleRow.items);
			expect(expanders).toHaveLength(2);
			expect(expanders[0].id).not.toBe(expanders[1].id);
		});

		test("expanding one expander in same file-block does not expand sibling expander group", () => {
			const rows = buildRows([makeFileBlockArticleWithTwoExpandableGroups("/a")]);
			const { result } = renderHook(() => useTestHook(rows));

			const firstRenderExpanders = findExpanders((result.current.results[0] as { items: unknown[] }).items);
			expect(firstRenderExpanders).toHaveLength(2);

			act(() => firstRenderExpanders[0].expand());

			const secondRenderExpanders = findExpanders((result.current.results[0] as { items: unknown[] }).items);
			expect(secondRenderExpanders).toHaveLength(1);
			expect(secondRenderExpanders[0].id).toBe(firstRenderExpanders[1].id);
		});

		test("focus.move can navigate through all focusable items in same file-block result", () => {
			const rows = buildRows([makeFileBlockArticleWithTwoExpandableGroups("/a")]);
			const { result } = renderHook(() => useTestHook(rows));

			const articleRow = result.current.results[0] as {
				id: string;
				items: Array<{ id: string; type: string }>;
			};
			const fileBlock = articleRow.items.find((x) => x.type === "file-block");
			const expanders = findExpanders(articleRow.items);
			expect(fileBlock).toBeDefined();
			expect(expanders).toHaveLength(2);
			const expectedOrder = [articleRow.id, fileBlock!.id, expanders[0].id, expanders[1].id];

			act(() => result.current.focus.move(1));
			expect(result.current.focus.current?.id).toBe(expectedOrder[0]);

			for (let i = 1; i < expectedOrder.length; i++) {
				act(() => result.current.focus.move(1));
				expect(result.current.focus.current?.id).toBe(expectedOrder[i]);
			}

			act(() => result.current.focus.move(1));
			expect(result.current.focus.current?.id).toBe(expectedOrder[expectedOrder.length - 1]);

			for (let i = expectedOrder.length - 2; i >= 0; i--) {
				act(() => result.current.focus.move(-1));
				expect(result.current.focus.current?.id).toBe(expectedOrder[i]);
			}

			act(() => result.current.focus.move(-1));
			expect(result.current.focus.current?.id).toBe(expectedOrder[0]);
		});
	});
});
