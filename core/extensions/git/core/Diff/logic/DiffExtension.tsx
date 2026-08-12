import type PageDataContext from "@core/Context/PageDataContext";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type { SidebarsIsPinValue } from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import debounceFunction from "@core-ui/debounceFunction";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import ProseMirrorDiffLineComponent from "@ext/git/core/Diff/components/ProseMirrorDiffLine";
import ProsemirrorAstDiffTransformer from "@ext/git/core/Diff/logic/astTransformer/ProseMirrorAstDiffTransformer";
import type { ProseMirrorDiffLine } from "@ext/git/core/Diff/logic/model/ProseMirrorDiffLine";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { getEditorContext } from "@ext/markdown/elementsUtils/editorContext/EditorContext";
import { feature } from "@ext/toggleFeatures/features";
import { type Editor, Extension } from "@tiptap/core";
import type { PluginView } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { TooltipProvider } from "@ui-kit/Tooltip";
import { Plugin, PluginKey } from "prosemirror-state";
import type { MutableRefObject } from "react";
import { createRoot, type Root } from "react-dom/client";

export const DIFF_DEBOUNCE_DELAY = 300;
const DIFF_DEBOUNCE_SYMBOL = Symbol();

export interface DiffExtensionProps {
	isOldEditor: boolean;
	articleRef: MutableRefObject<HTMLDivElement>;
	apiUrlCreator: ApiUrlCreator;
	articlePath: string;
	isPin: SidebarsIsPinValue;
	oldScope: TreeReadScope;
	newScope: TreeReadScope;
	isDoublePanel: boolean;
	pageDataContext: PageDataContext;
	catalogProps: ClientCatalogProps;
}

export interface DiffExtensionStore {
	diffLines: ProseMirrorDiffLine[];
	isOldEditor: boolean;
	isPin: SidebarsIsPinValue;
	oldScope: TreeReadScope;
	newScope: TreeReadScope;
	isDoublePanel: boolean;
}

declare module "@tiptap/core" {
	interface Storage {
		diffLines: DiffExtensionStore;
	}

	interface Commands<ReturnType> {
		diffLines: {
			updateDiffLinesModel: (diffLines: ProseMirrorDiffLine[]) => ReturnType;
			updateIsDoublePanel: (isDoublePanel: boolean, triggerUpdate?: boolean) => ReturnType;
			updateIsPin: (isPin: SidebarsIsPinValue, triggerUpdate?: boolean) => ReturnType;
		};
	}
}

class DiffLines implements PluginView {
	private readonly _diffLinesStratchPixels = -1;
	private readonly _deletedDiffLineHeight = 5;

	private _article: HTMLDivElement;

	private static _editorRenderData: Map<Editor, { root: Root; element: HTMLElement }[]> = new Map();
	private _onEditorDestroyBounded: () => void;
	private _extensionStore: DiffExtensionStore;

	constructor(
		private _editor: Editor,
		private _articlePath: string,
	) {
		this._article = document.getElementById("article") as HTMLDivElement;
		this._onEditorDestroyBounded = this._onEditorDestroy.bind(this);
		this._editor.on("destroy", this._onEditorDestroyBounded);
		this._extensionStore = this._editor.storage.diffLines;
	}

	private _articleRef(): HTMLDivElement {
		return getEditorContext(this._editor).articleRef?.current;
	}

	update() {
		debounceFunction(DIFF_DEBOUNCE_SYMBOL, this._update.bind(this), DIFF_DEBOUNCE_DELAY);
	}

	destroy() {
		this._editor.off("destroy", this._onEditorDestroyBounded);
	}

	private _update() {
		if (this._editor.isDestroyed) return;

		const isDoublePanel = this._extensionStore.isDoublePanel;

		const diffLines = isDoublePanel
			? this._extensionStore.diffLines.filter((x) => x.type !== "deleted")
			: this._extensionStore.diffLines;

		let renderData = this._getRenderData();

		if (diffLines?.length > renderData?.length) {
			this._addNewRenderData(diffLines.length - renderData.length);
		} else if (diffLines?.length < renderData?.length) {
			this._removeOldRenderData(renderData.length - diffLines.length);
		}

		renderData = this._getRenderData();

		renderData.forEach((_, idx) => {
			const rootData = this._getRenderData()[idx];
			const diffLine = diffLines[idx];
			const uniqueKey = `${diffLine.pos.from}-${diffLine.pos.to}`;

			const { apiUrlCreator, pageDataContext, catalogProps } = getEditorContext(this._editor);
			rootData.root.render(
				<TooltipProvider>
					<PageDataContextService.Provider value={pageDataContext}>
						<CatalogStoreProvider data={catalogProps}>
							<ApiUrlCreatorService.Provider value={apiUrlCreator}>
								<ArticleRefService.Provider value={this._articleRef()}>
									<ProseMirrorDiffLineComponent
										articlePath={this._articlePath}
										diffLine={diffLine}
										height={this._getHeight(diffLine)}
										key={uniqueKey}
										left={this._getLeft(diffLine)}
										oldScope={this._extensionStore.oldScope}
										onDiscard={this._getOnDiscard(diffLine)?.bind(this)}
										top={this._getTop(diffLine)}
									/>
								</ArticleRefService.Provider>
							</ApiUrlCreatorService.Provider>
						</CatalogStoreProvider>
					</PageDataContextService.Provider>
				</TooltipProvider>,
			);
		});
	}

	private _getOnDiscard(diffLine: ProseMirrorDiffLine) {
		if (diffLine.type !== "modified") return;
		return () => {
			const content = ProsemirrorAstDiffTransformer.getContentBySingleParagraphDoc(diffLine.oldContent);
			this._editor.commands.insertContentAt({ from: diffLine.pos.from, to: diffLine.pos.to + 1 }, content); // + 1 to include the last character
		};
	}

	private _getTop(diffLine: ProseMirrorDiffLine) {
		if (diffLine.type === "deleted") {
			const coordTop = this._editor.view.coordsAtPos(diffLine.insertAfter + 1).bottom; // +1 to include the last character
			return coordTop + this._articleRef().scrollTop;
		}

		const coordTop = this._editor.view.coordsAtPos(diffLine.pos.from).top;

		return coordTop + this._articleRef().scrollTop - this._diffLinesStratchPixels;
	}

	private _getHeight(diffLine: ProseMirrorDiffLine) {
		if (diffLine.type === "deleted") return this._deletedDiffLineHeight;

		const coordsStart = this._editor.view.coordsAtPos(diffLine.pos.from);
		const coordsEnd = this._editor.view.coordsAtPos(diffLine.pos.to + 1); // +1 to include the last character
		return coordsEnd.bottom - coordsStart.top + this._diffLinesStratchPixels * 2;
	}

	private _getLeft(diffLine: ProseMirrorDiffLine) {
		const isComment = diffLine.type === "comment";
		const isPin = this._extensionStore?.isPin;
		const leftOffest = isComment ? "7px" : "2px";
		return isPin.left ? leftOffest : `calc(30px + ${leftOffest})`;
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
	name: "diffLines",

	addOptions() {
		return {
			isOldEditor: false,
			articleRef: null,
			isPin: { left: true, right: true },
			articlePath: null,
			apiUrlCreator: null,
			pageDataContext: null,
			catalogProps: null,
			oldScope: undefined,
			newScope: undefined,
			isDoublePanel: false,
		};
	},

	addStorage() {
		return {
			isOldEditor: this.options.isOldEditor,
			isPin: this.options.isPin,
			diffLines: [],
			oldScope: this.options.oldScope,
			newScope: this.options.newScope,
			isDoublePanel: this.options.isDoublePanel,
		};
	},

	addCommands() {
		return {
			updateDiffLinesModel:
				(diffLines) =>
				({ editor }) => {
					editor.storage.diffLines.diffLines = diffLines;
					return true;
				},
			updateIsDoublePanel:
				(isDoublePanel, triggerUpdate = true) =>
				({ editor }) => {
					editor.storage.diffLines.isDoublePanel = isDoublePanel;
					if (triggerUpdate) editor.commands.focus(undefined, { scrollIntoView: false });
					return true;
				},
			updateIsPin:
				(isPin, triggerUpdate = true) =>
				({ editor }) => {
					editor.storage.diffLines.isPin = isPin;
					if (triggerUpdate) editor.commands.focus(undefined, { scrollIntoView: false });
					return true;
				},
		};
	},

	addProseMirrorPlugins() {
		const inlineDiffDecorators = !feature("new-diffs")
			? new Plugin({
					key: new PluginKey("inlineDiffDecorators"),
					state: {
						init() {
							return DecorationSet.empty;
						},
						apply(tr, set) {
							const addDecoration = tr.getMeta("updateDiffDecorators");
							if (addDecoration) return addDecoration;
							return set;
						},
					},
					props: {
						decorations(state) {
							return this.getState(state);
						},
					},
				})
			: undefined;

		if (this.editor.storage.diffLines.isOldEditor) return [inlineDiffDecorators].filter(Boolean);
		return [
			new Plugin({
				key: new PluginKey("diff-lines"),
				view: () => {
					return new DiffLines(this.editor, this.options.articlePath);
				},
			}),
			inlineDiffDecorators,
		].filter(Boolean);
	},
});

export default DiffExtension;
