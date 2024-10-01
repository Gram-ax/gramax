import { Attrs } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

import {
	Dragging,
	ResizeState,
	TableMap,
	TableView,
	cellAround,
	columnResizingPluginKey,
	tableNodeTypes,
} from "prosemirror-tables";

import { CellAttrs } from "@ext/markdown/elements/table/edit/model/columnResizing/CellAttrs";
import { updateColumnsOnResize } from "@ext/markdown/elements/table/edit/model/columnResizing/updateColumns";
import stopOpeningPanels from "@core-ui/utils/stopOpeningPanels ";
const navsSymbol = Symbol();

type ColumnResizingOptions = {
	handleWidth?: number;
	cellMinWidth?: number;
	lastColumnResizable?: boolean;
	View?: typeof TableView;
};

export function columnResizing({
	handleWidth = 5,
	cellMinWidth = 25,
	View = TableView,
	lastColumnResizable = true,
}: ColumnResizingOptions = {}): Plugin {
	const plugin = new Plugin<ResizeState>({
		key: columnResizingPluginKey,
		state: {
			init(_, state) {
				plugin.spec.props.nodeViews[tableNodeTypes(state.schema).table.name] = (node) =>
					new View(node, cellMinWidth);
				return new ResizeState(-1, false);
			},
			apply(tr, prev) {
				return prev.apply(tr);
			},
		},
		props: {
			attributes: (state): Record<string, string> => {
				const pluginState = columnResizingPluginKey.getState(state);
				return pluginState && pluginState.activeHandle > -1 ? { class: "resize-cursor" } : {};
			},

			handleDOMEvents: {
				mousemove: (view, event) => {
					handleMouseMove(view, event, handleWidth, lastColumnResizable);
				},
				mouseleave: (view) => {
					handleMouseLeave(view);
				},
				mousedown: (view, event) => {
					handleMouseDown(view, event, cellMinWidth);
				},
			},

			decorations: (state) => {
				const pluginState = columnResizingPluginKey.getState(state);
				if (pluginState && pluginState.activeHandle > -1) {
					return handleDecorations(state, pluginState.activeHandle);
				}
			},

			nodeViews: {},
		},
	});
	return plugin;
}

function handleMouseMove(view: EditorView, event: MouseEvent, handleWidth: number, lastColumnResizable: boolean): void {
	const pluginState = columnResizingPluginKey.getState(view.state);
	if (!pluginState) return;

	if (!pluginState.dragging) {
		const target = domCellAround(event.target as HTMLElement);
		let cell = -1;
		if (target) {
			const { left, right } = target.getBoundingClientRect();
			if (event.clientX - left <= handleWidth) cell = edgeCell(view, event, "left", handleWidth);
			else if (right - event.clientX <= handleWidth) cell = edgeCell(view, event, "right", handleWidth);
		}

		if (cell != pluginState.activeHandle) {
			if (!lastColumnResizable && cell !== -1) {
				const $cell = view.state.doc.resolve(cell);
				const table = $cell.node(-1);
				const map = TableMap.get(table);
				const tableStart = $cell.start(-1);
				const col = map.colCount($cell.pos - tableStart) + $cell.nodeAfter.attrs.colspan - 1;

				if (col == map.width - 1) {
					return;
				}
			}

			updateHandle(view, cell);
		}
	}
}

function handleMouseLeave(view: EditorView): void {
	const pluginState = columnResizingPluginKey.getState(view.state);
	if (pluginState && pluginState.activeHandle > -1 && !pluginState.dragging) updateHandle(view, -1);
}

function handleMouseDown(view: EditorView, event: MouseEvent, cellMinWidth: number): boolean {
	const win = view.dom.ownerDocument.defaultView ?? window;
	const pluginState = columnResizingPluginKey.getState(view.state);
	if (!pluginState || pluginState.activeHandle == -1 || pluginState.dragging) return false;
	const updatePanels = () => stopOpeningPanels(navsSymbol, view, true);

	const cell = view.state.doc.nodeAt(pluginState.activeHandle);
	const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
	view.dispatch(
		view.state.tr.setMeta(columnResizingPluginKey, {
			setDragging: { startX: event.clientX, startWidth: width },
		}),
	);

	function finish(event: MouseEvent) {
		win.removeEventListener("mouseup", finish);
		win.removeEventListener("mousemove", move);
		const pluginState = columnResizingPluginKey.getState(view.state);
		if (pluginState?.dragging) {
			updateColumnWidth(view, pluginState.activeHandle, draggedWidth(pluginState.dragging, event, cellMinWidth));
			view.dispatch(view.state.tr.setMeta(columnResizingPluginKey, { setDragging: null }));
		}
	}

	function move(event: MouseEvent): void {
		updatePanels();
		if (!event.which) return finish(event);
		const pluginState = columnResizingPluginKey.getState(view.state);
		if (!pluginState) return;
		if (pluginState.dragging) {
			const dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
			displayColumnWidth(view, pluginState.activeHandle, dragged);
		}
	}

	win.addEventListener("mouseup", finish);
	win.addEventListener("mousemove", move);
	event.preventDefault();
	return true;
}

function currentColWidth(view: EditorView, cellPos: number, { colspan, colwidth }: Attrs): number {
	const width = colwidth && colwidth[colwidth.length - 1];
	if (width) return width;
	const dom = view.domAtPos(cellPos);
	const node = dom.node.childNodes[dom.offset] as HTMLElement;
	let domWidth = node.offsetWidth,
		parts = colspan;
	if (colwidth)
		for (let i = 0; i < colspan; i++)
			if (colwidth[i]) {
				domWidth -= colwidth[i];
				parts--;
			}
	return domWidth / parts;
}

function domCellAround(target: HTMLElement | null): HTMLElement | null {
	while (target && target.nodeName != "TD" && target.nodeName != "TH")
		target =
			target.classList && target.classList.contains("ProseMirror") ? null : (target.parentNode as HTMLElement);
	return target;
}

function edgeCell(view: EditorView, event: MouseEvent, side: "left" | "right", handleWidth: number): number {
	// posAtCoords returns inconsistent positions when cursor is moving
	// across a collapsed table border. Use an offset to adjust the
	// target viewport coordinates away from the table border.
	const offset = side == "right" ? -handleWidth : handleWidth;
	const found = view.posAtCoords({
		left: event.clientX + offset,
		top: event.clientY,
	});
	if (!found) return -1;
	const { pos } = found;
	const $cell = cellAround(view.state.doc.resolve(pos));
	if (!$cell) return -1;
	if (side == "right") return $cell.pos;
	const map = TableMap.get($cell.node(-1)),
		start = $cell.start(-1);
	const index = map.map.indexOf($cell.pos - start);
	return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function draggedWidth(dragging: Dragging, event: MouseEvent, cellMinWidth: number): number {
	const offset = event.clientX - dragging.startX;
	return Math.max(cellMinWidth, dragging.startWidth + offset);
}

function updateHandle(view: EditorView, value: number): void {
	view.dispatch(view.state.tr.setMeta(columnResizingPluginKey, { setHandle: value }));
}

function updateColumnWidth(view: EditorView, cell: number, width: number): void {
	const $cell = view.state.doc.resolve(cell);
	const table = $cell.node(-1),
		map = TableMap.get(table),
		start = $cell.start(-1);
	const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
	const tr = view.state.tr;
	for (let row = 0; row < map.height; row++) {
		const mapIndex = row * map.width + col;
		// Rowspanning cell that has already been handled
		if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
		const pos = map.map[mapIndex];
		const attrs = table.nodeAt(pos).attrs as CellAttrs;
		const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
		if (attrs.colwidth && attrs.colwidth[index] == width) continue;
		const colwidth = attrs.colwidth ? attrs.colwidth.slice() : zeroes(attrs.colspan);
		colwidth[index] = width;
		tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth: colwidth });
	}
	if (tr.docChanged) view.dispatch(tr);
}

function displayColumnWidth(view: EditorView, cell: number, width: number): void {
	const $cell = view.state.doc.resolve(cell);
	const table = $cell.node(-1),
		start = $cell.start(-1);
	const col = TableMap.get(table).colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
	let dom: Node | null = view.domAtPos($cell.start(-1)).node;
	while (dom && dom.nodeName != "TABLE") {
		dom = dom.parentNode;
	}
	if (!dom) return;
	updateColumnsOnResize(table, dom.firstChild as HTMLTableColElement, dom as HTMLTableElement, col, width);
}

function zeroes(n: number): 0[] {
	return Array(n).fill(0);
}

function handleDecorations(state: EditorState, cell: number): DecorationSet {
	const decorations = [];
	const $cell = state.doc.resolve(cell);
	const table = $cell.node(-1);
	if (!table) {
		return DecorationSet.empty;
	}
	const map = TableMap.get(table);
	const start = $cell.start(-1);
	const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan;
	for (let row = 0; row < map.height; row++) {
		const index = col + row * map.width - 1;
		// For positions that have either a different cell or the end
		// of the table to their right, and either the top of the table or
		// a different cell above them, add a decoration
		if (
			(col == map.width || map.map[index] != map.map[index + 1]) &&
			(row == 0 || map.map[index] != map.map[index - map.width])
		) {
			const cellPos = map.map[index];
			const pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
			const dom = document.createElement("div");
			dom.className = "column-resize-handle";
			decorations.push(Decoration.widget(pos, dom));
		}
	}
	return DecorationSet.create(state.doc, decorations);
}
