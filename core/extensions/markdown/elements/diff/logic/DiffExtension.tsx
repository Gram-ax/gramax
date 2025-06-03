import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { SidebarsIsPinValue } from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import debounceFunction from "@core-ui/debounceFunction";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { Editor, Extension } from "@tiptap/core";
import { PluginView } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "prosemirror-state";
import { MutableRefObject } from "react";

import ProseMirrorDiffLineComponent from "@ext/markdown/elements/diff/components/ProseMirrorDiffLine";
import { ProseMirrorDiffLine } from "@ext/markdown/elements/diff/logic/model/ProseMirrorDiffLine";
import { createRoot, Root } from "react-dom/client";

export const DIFF_DEBOUNCE_DELAY = 300;
const DIFF_DEBOUNCE_SYMBOL = Symbol();

export interface DiffExtensionProps {
	isOldEditor: boolean;
	articleRef: MutableRefObject<HTMLDivElement>;
	apiUrlCreator: ApiUrlCreator;
	isPin: SidebarsIsPinValue;
	oldScope: TreeReadScope;
	newScope: TreeReadScope;
}

export interface DiffExtensionStore {
	diffLines: ProseMirrorDiffLine[];
	isOldEditor: boolean;
	isPin: SidebarsIsPinValue;
	oldScope: TreeReadScope;
	newScope: TreeReadScope;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		diff: { updateDiffLinesModel: (diffLines: ProseMirrorDiffLine[]) => ReturnType };
	}
}

class DiffLines implements PluginView {
	private readonly _diffLinesStratchPixels = 2;
	private _article: HTMLDivElement;
	private _articleRef: HTMLDivElement;
	private static _editorRenderData: Map<Editor, { root: Root; element: HTMLElement }[]> = new Map();
	private _onEditorDestroyBounded: () => void;
	private _extensionStore: DiffExtensionStore;
	constructor(
		private _editor: Editor,
		articleRef: MutableRefObject<HTMLDivElement>,
		private _apiUrlCreator: ApiUrlCreator,
	) {
		this._article = document.getElementById("article") as HTMLDivElement;
		this._articleRef = articleRef.current;
		this._onEditorDestroyBounded = this._onEditorDestroy.bind(this);
		this._editor.on("destroy", this._onEditorDestroyBounded);
		this._extensionStore = this._editor.storage.diff;
	}

	update() {
		debounceFunction(DIFF_DEBOUNCE_SYMBOL, this._update.bind(this), DIFF_DEBOUNCE_DELAY);
	}

	destroy() {
		this._editor.off("destroy", this._onEditorDestroyBounded);
	}

	private _update() {
		if (this._editor.isDestroyed) return;
		const diffLines = this._extensionStore.diffLines;
		let renderData = this._getRenderData();

		if (diffLines.length > renderData.length) {
			this._addNewRenderData(diffLines.length - renderData.length);
		} else if (diffLines.length < renderData.length) {
			this._removeOldRenderData(renderData.length - diffLines.length);
		}

		renderData = this._getRenderData();

		renderData.forEach((_, idx) => {
			const rootData = this._getRenderData()[idx];
			const diffLine = diffLines[idx];
			const coordsStart = this._editor.view.coordsAtPos(diffLine.pos.from);
			const coordsEnd = this._editor.view.coordsAtPos(diffLine.pos.to + 1); // +1 to include the last character
			const left = this._getLeft();

			rootData.root.render(
				<ApiUrlCreatorService.Provider value={this._apiUrlCreator}>
					<ProseMirrorDiffLineComponent
						diffLine={diffLine}
						oldScope={this._extensionStore.oldScope}
						left={left}
						top={coordsStart.top + this._articleRef.scrollTop - this._diffLinesStratchPixels}
						height={coordsEnd.bottom - coordsStart.top + this._diffLinesStratchPixels * 2}
					/>
				</ApiUrlCreatorService.Provider>,
			);
		});
	}

	private _getLeft() {
		const isPin = this._extensionStore.isPin;
		const leftOffest = "0.5rem";
		return isPin.left
			? `calc((${this._article.getBoundingClientRect().left}px - var(--left-nav-width) - ${leftOffest}) * -1)`
			: `calc((${this._article.getBoundingClientRect().left}px - 30px - ${leftOffest}) * -1) `;
	}

	private _addNewRenderData(count: number) {
		const documentFragment = document.createDocumentFragment();
		const renderData = this._getRenderData();
		for (let i = 0; i < count; i++) {
			const diffLineElement = document.createElement("div");
			diffLineElement.dataset.type = "diff-line";
			const root = createRoot(diffLineElement);
			renderData.push({ root, element: diffLineElement });
			documentFragment.appendChild(diffLineElement);
		}
		this._setRenderData(renderData);
		this._article.appendChild(documentFragment);
	}

	private _removeOldRenderData(count: number) {
		const renderData = this._getRenderData();
		for (let i = renderData.length - 1; i >= renderData.length - count; i--) {
			const { element, root } = renderData[i];
			root.unmount();
			element.remove();
		}
		renderData.splice(renderData.length - count, count);
		this._setRenderData(renderData);
	}

	private _getRenderData() {
		return DiffLines._editorRenderData.get(this._editor) ?? [];
	}

	private _setRenderData(renderData: { root: Root; element: HTMLElement }[]) {
		DiffLines._editorRenderData.set(this._editor, renderData);
	}

	private _onEditorDestroy() {
		this._removeOldRenderData(this._getRenderData().length);
		DiffLines._editorRenderData.delete(this._editor);
	}
}

const DiffExtension = Extension.create<DiffExtensionProps, DiffExtensionStore>({
	name: "diff",

	addOptions() {
		return {
			isOldEditor: false,
			articleRef: null,
			isPin: { left: true, right: true },
			apiUrlCreator: null,
			oldScope: undefined,
			newScope: undefined,
		};
	},

	addStorage() {
		return {
			isOldEditor: this.options.isOldEditor,
			isPin: this.options.isPin,
			diffLines: [],
			oldScope: this.options.oldScope,
			newScope: this.options.newScope,
		};
	},

	addCommands() {
		return {
			updateDiffLinesModel:
				(diffLines) =>
				({ editor }) => {
					editor.storage.diff.diffLines = diffLines;
					return true;
				},
		};
	},

	addProseMirrorPlugins() {
		if (this.editor.storage.diff.isOldEditor) return [];
		return [
			new Plugin({
				key: new PluginKey("diff-lines"),
				view: () => {
					const diffLines = new DiffLines(this.editor, this.options.articleRef, this.options.apiUrlCreator);
					return diffLines;
				},
			}),
		];
	},
});

export default DiffExtension;
