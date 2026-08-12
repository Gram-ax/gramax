import { getEditorContext } from "@ext/markdown/elementsUtils/editorContext/EditorContext";
import { type Editor, Extension } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { Plugin } from "prosemirror-state";

export const DRAG_SCROLL_THRESHOLD = 0.15;

class DragScroller {
	private _scrollIntervalId: number;
	private _mouseY: number;
	private _articleElement: HTMLElement;
	private _handlers: { name: string; handler: (event: Event) => void }[];

	constructor(
		readonly editorView: EditorView,
		private _editor: Editor,
	) {
		this._handlers = ["dragover", "dragend", "dragleave", "drop"].map((name) => {
			const handler = (e: Event) => {
				this[name](e);
			};

			editorView.dom.addEventListener(name, handler);
			return { name, handler };
		});
	}

	private _resolveArticleElement(): HTMLElement | null {
		if (this._articleElement) return this._articleElement;
		this._articleElement = getEditorContext(this._editor).articleRef?.current ?? null;
		return this._articleElement;
	}

	destroy() {
		this._handlers?.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
	}

	update() {}

	private _getSpeed(mouseY: number, windowHeight: number, scrollingDown: boolean): number {
		const marginY = windowHeight * DRAG_SCROLL_THRESHOLD;
		const distanceFromEdge = scrollingDown ? windowHeight - mouseY : mouseY;

		const maxDistance = windowHeight - marginY;
		const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / maxDistance));

		return 5 + (10 - 5) * normalizedDistance;
	}

	private _startScrolling() {
		const scroll = () => {
			const mouseY = this._mouseY;
			const windowHeight = window.innerHeight;
			let scrollingDown = false;

			if (mouseY > windowHeight - windowHeight * DRAG_SCROLL_THRESHOLD) scrollingDown = true;
			else if (mouseY < windowHeight * DRAG_SCROLL_THRESHOLD) scrollingDown = false;
			else scrollingDown = null;

			const speed = scrollingDown !== null ? this._getSpeed(mouseY, windowHeight, scrollingDown) : 0;
			const scrollAmount = scrollingDown ? speed : -speed;
			this._articleElement?.scrollBy(0, scrollAmount);

			if (scrollingDown !== null) this._scrollIntervalId = requestAnimationFrame(scroll);
		};

		this._scrollIntervalId = requestAnimationFrame(scroll);
	}

	private _stopScrolling() {
		if (this._scrollIntervalId !== null) {
			cancelAnimationFrame(this._scrollIntervalId);
			this._scrollIntervalId = null;
		}
	}

	dragover(e: DragEvent) {
		if (!this._resolveArticleElement()) return;
		this._mouseY = e.clientY;
		if (!this._scrollIntervalId) this._startScrolling();
	}

	dragleave() {
		this._stopScrolling();
	}

	dragend() {
		this._stopScrolling();
	}

	drop() {
		this._stopScrolling();
	}
}

const DragScrollerExt = Extension.create({
	name: "DragScroller",

	addOptions() {
		return {};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				view: (view) => {
					return new DragScroller(view, this.editor);
				},
			}),
		];
	},
});

export default DragScrollerExt;
