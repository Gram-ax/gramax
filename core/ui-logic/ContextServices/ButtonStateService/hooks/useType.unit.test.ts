/** biome-ignore-all lint/style/useNamingConvention: expected */
import { act, renderHook } from "@testing-library/react";
import useType from "./useType";

const makeNode = (typeName: string, marks: { type: { name: string }; attrs?: Record<string, unknown> }[] = []) => ({
	type: { name: typeName },
	marks,
	attrs: {},
});

const makeDoc = (nodes: ReturnType<typeof makeNode>[]) => ({
	nodesBetween: (_from: number, _to: number, cb: (node: ReturnType<typeof makeNode>) => void) => {
		nodes.forEach((n) => cb(n));
	},
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

describe("useType", () => {
	test("initial state — empty marks and actions", () => {
		const editor = makeEditor(makeEditorState());
		const { result } = renderHook(() => useType(editor as never));

		expect(result.current.marks).toEqual([]);
		expect(result.current.actions).toEqual([]);
	});

	test("returns active marks after selectionUpdate", () => {
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
			editor._emit("selectionUpdate");
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
			editor._emit("selectionUpdate");
		});
		expect(result.current.marks).toContain("strong");

		// Then — cursor without mark
		const selectionEmpty = makeSelection({ empty: true });
		const docEmpty = makeDoc([makeNode("paragraph")]);
		editor.state = makeEditorState({ selection: selectionEmpty, doc: docEmpty } as never);
		act(() => {
			editor._emit("selectionUpdate");
		});

		expect(result.current.marks).not.toContain("strong");
	});

	test("subscribes to update and selectionUpdate on mount", () => {
		const editor = makeEditor(makeEditorState());
		renderHook(() => useType(editor as never));

		expect(editor.on).toHaveBeenCalledWith("update", expect.any(Function));
		expect(editor.on).toHaveBeenCalledWith("selectionUpdate", expect.any(Function));
	});

	test("unsubscribes on unmount", () => {
		const editor = makeEditor(makeEditorState());
		const { unmount } = renderHook(() => useType(editor as never));

		unmount();

		expect(editor.off).toHaveBeenCalledWith("selectionUpdate", expect.any(Function));
		expect(editor.off).toHaveBeenCalledWith("update", expect.any(Function));
	});

	test("does not update state if nothing has changed", () => {
		const editor = makeEditor(makeEditorState());
		const { result } = renderHook(() => useType(editor as never));

		act(() => {
			editor._emit("selectionUpdate");
		});

		const stateAfterFirst = result.current;

		act(() => {
			editor._emit("selectionUpdate");
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
			editor._emit("selectionUpdate");
		});

		expect(result.current.marks).toContain("strong");
		expect(result.current.marks).toContain("em");
	});
});
