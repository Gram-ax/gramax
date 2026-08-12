/** biome-ignore-all lint/style/useNamingConvention: expected */
import { act, renderHook } from "@testing-library/react";
import useType, { getFilteredActions } from "./useType";

const makeNodeRange = (typeName: string, attrs: Record<string, unknown> = {}) => ({
	node: { type: { name: typeName }, attrs, marks: [], nodeSize: 1 },
	from: 0,
	to: 1,
});

const makeNode = (typeName: string, marks: { type: { name: string }; attrs?: Record<string, unknown> }[] = []) => ({
	type: { name: typeName },
	marks,
	attrs: {},
	nodeSize: 1,
});

const makeDoc = (
	nodes: ReturnType<typeof makeNode>[],
	resolvedMarks: { type: { name: string }; attrs?: Record<string, unknown> }[] = [],
) => ({
	nodesBetween: (_from: number, _to: number, cb: (node: ReturnType<typeof makeNode>, pos: number) => void) => {
		nodes.forEach((n, i) => cb(n, i));
	},
	resolve: (_pos: number) => ({
		marks: () => resolvedMarks,
	}),
});

const makeSelection = (
	overrides: Partial<{
		from: number;
		to: number;
		empty: boolean;
		$anchor: unknown;
		$head: unknown;
		$from: unknown;
	}> = {},
) => {
	const $from = {
		node: () => makeNode("paragraph"),
		nodeAfter: null,
		nodeBefore: null,
		marks: () => [],
		depth: 0,
		parent: makeNode("paragraph"),
		before: () => 0,
		doc: null as unknown,
	};
	$from.doc = { resolve: () => null };

	const $head = { marks: () => [] };
	const $anchor = {
		parent: makeNode("paragraph"),
		node: () => null,
		depth: 0,
		before: () => 0,
		doc: { resolve: () => null },
	};

	return {
		from: 0,
		to: 0,
		empty: true,
		$anchor,
		$head,
		$from,
		...overrides,
	};
};

const makeEditorState = (
	overrides: Partial<{ selection: ReturnType<typeof makeSelection>; storedMarks: unknown[] }> = {},
) => ({
	selection: makeSelection(),
	storedMarks: null,
	doc: makeDoc([]),
	...overrides,
});

const makeEditor = (state: ReturnType<typeof makeEditorState>) => {
	const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

	const editor = {
		state,
		on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
			listeners[event] = listeners[event] ?? [];
			listeners[event].push(cb);
		}),
		off: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
			listeners[event] = (listeners[event] ?? []).filter((fn) => fn !== cb);
		}),
		_emit: (event: string) => {
			(listeners[event] ?? []).forEach((cb) => cb({ editor }));
		},
	};

	return editor;
};

describe("getFilteredActions", () => {
	test("excludes system node types", () => {
		const systemTypes = ["doc", "text", "listItem", "taskItem", "tableHeader", "tableCell", "tableRow"];
		const ranges = systemTypes.map((t) => makeNodeRange(t)) as never[];
		expect(getFilteredActions(ranges)).toEqual([]);
	});

	test("includes non-system node types", () => {
		const ranges = [makeNodeRange("heading"), makeNodeRange("paragraph"), makeNodeRange("table")] as never[];
		expect(getFilteredActions(ranges)).toEqual(["heading", "paragraph", "table"]);
	});

	test("filters mixed list keeping only non-system nodes", () => {
		const ranges = [
			makeNodeRange("doc"),
			makeNodeRange("heading"),
			makeNodeRange("listItem"),
			makeNodeRange("note"),
		] as never[];
		expect(getFilteredActions(ranges)).toEqual(["heading", "note"]);
	});

	test("returns empty array for empty input", () => {
		expect(getFilteredActions([])).toEqual([]);
	});
});

describe("useType", () => {
	test("initial state — empty marks and actions", () => {
		const editor = makeEditor(makeEditorState());
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.marks).toEqual([]);
		expect(result.current.actions).toEqual([]);
	});

	test("returns active marks after transaction", () => {
		const strongMark = { type: { name: "strong" }, attrs: {} };
		const selection = makeSelection({
			empty: false,
			from: 0,
			to: 5,
		});

		const doc = makeDoc([makeNode("text", [strongMark]), makeNode("paragraph")]);
		const state = makeEditorState({ selection, doc } as never);
		const editor = makeEditor(state);

		const { result } = renderHook(() => useType(editor as never));

		act(() => {
			editor._emit("transaction");
		});

		expect(result.current.marks).toContain("strong");
	});

	test("resets marks when cursor leaves marked text", () => {
		const strongMark = { type: { name: "strong" }, attrs: {} };

		// First — selection with mark
		const selectionWithMark = makeSelection({ empty: false, from: 0, to: 5 });
		const docWithMark = makeDoc([makeNode("text", [strongMark]), makeNode("paragraph")]);
		const stateWithMark = makeEditorState({ selection: selectionWithMark, doc: docWithMark } as never);
		const editor = makeEditor(stateWithMark);

		const { result } = renderHook(() => useType(editor as never));

		act(() => {
			editor._emit("transaction");
		});
		expect(result.current.marks).toContain("strong");

		// Then — cursor without mark
		const selectionEmpty = makeSelection({ empty: true });
		const docEmpty = makeDoc([makeNode("paragraph")]);
		editor.state = makeEditorState({ selection: selectionEmpty, doc: docEmpty } as never);
		act(() => {
			editor._emit("transaction");
		});

		expect(result.current.marks).not.toContain("strong");
	});

	test("subscribes to transaction on mount", () => {
		const editor = makeEditor(makeEditorState());
		renderHook(() => useType(editor as never));

		expect(editor.on).toHaveBeenCalledWith("transaction", expect.any(Function));
	});

	test("unsubscribes on unmount", () => {
		const editor = makeEditor(makeEditorState());
		const { unmount } = renderHook(() => useType(editor as never));

		unmount();

		expect(editor.off).toHaveBeenCalledWith("transaction", expect.any(Function));
	});

	test("does not update state if nothing has changed", () => {
		const editor = makeEditor(makeEditorState());
		const { result } = renderHook(() => useType(editor as never));

		act(() => {
			editor._emit("transaction");
		});

		const stateAfterFirst = result.current;

		act(() => {
			editor._emit("transaction");
		});

		expect(result.current).toBe(stateAfterFirst);
	});

	test("returns multiple marks simultaneously", () => {
		const selection = makeSelection({ empty: false, from: 0, to: 5 });
		const doc = makeDoc([
			makeNode("text", [
				{ type: { name: "strong" }, attrs: {} },
				{ type: { name: "em" }, attrs: {} },
			]),
			makeNode("paragraph"),
		]);
		const editor = makeEditor(makeEditorState({ selection, doc } as never));
		const { result } = renderHook(() => useType(editor as never));

		act(() => {
			editor._emit("transaction");
		});

		expect(result.current.marks).toContain("strong");
		expect(result.current.marks).toContain("em");
	});

	test("returns heading level in attrs", () => {
		const selection = makeSelection({ empty: false, from: 0, to: 5 });
		const headingNode = { type: { name: "heading" }, marks: [], attrs: { level: 2 }, nodeSize: 1, isText: false };
		const doc = {
			nodesBetween: (_f: number, _t: number, cb: (n: typeof headingNode, pos: number) => void) =>
				cb(headingNode, 0),
			resolve: () => ({ marks: () => [] }),
		};
		const editor = makeEditor(makeEditorState({ selection, doc } as never));
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.attrs.level).toBe(2);
	});

	test("returns note type in attrs", () => {
		const selection = makeSelection({ empty: false, from: 0, to: 5 });
		const noteNode = { type: { name: "note" }, marks: [], attrs: { type: "info" }, nodeSize: 1, isText: false };
		const doc = {
			nodesBetween: (_f: number, _t: number, cb: (n: typeof noteNode, pos: number) => void) => cb(noteNode, 0),
			resolve: () => ({ marks: () => [] }),
		};
		const editor = makeEditor(makeEditorState({ selection, doc } as never));
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.attrs.type).toBe("info");
	});

	test("returns empty state when editor.state is absent", () => {
		const editor = { state: null, on: jest.fn(), off: jest.fn() };
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.marks).toEqual([]);
		expect(result.current.actions).toEqual([]);
	});

	test("returns actions for non-system nodes in selection", () => {
		const selection = makeSelection({ empty: false, from: 0, to: 5 });
		const doc = makeDoc([makeNode("heading"), makeNode("paragraph"), makeNode("listItem")]);
		const editor = makeEditor(makeEditorState({ selection, doc } as never));
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.actions).toContain("heading");
		expect(result.current.actions).toContain("paragraph");
		expect(result.current.actions).not.toContain("listItem");
	});

	test("exposes current selection in state", () => {
		const selection = makeSelection({ from: 3, to: 7, empty: false });
		const doc = makeDoc([]);
		const editor = makeEditor(makeEditorState({ selection, doc } as never));
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.selection).toBe(selection);
	});
});
