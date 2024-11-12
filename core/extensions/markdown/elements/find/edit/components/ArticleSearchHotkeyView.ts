import StyledArticleSearch from "@ext/markdown/elements/find/edit/components/ArticleSearch";
import ReactRenderer from "@ext/markdown/elementsUtils/prosemirrorPlugins/ReactRenderer";
import { Editor } from "@tiptap/core";

export type CustomDecorations = { start: number; end: number; isActive: boolean };

class ArticleSearchHotkeyView extends ReactRenderer {
	protected _element: HTMLElement;
	public decorations: CustomDecorations[] = [];
	private _editor: Editor;

	constructor() {
		super(StyledArticleSearch, { isOpen: false }, document?.body, true);

		this._createElement();
		this._initialization(this._element);
		this.updateProps({
			closeHandle: () => this.closeSearch(),
			openHandle: () => this.updateProps({ isOpen: true }),
			decorations: this.decorations,
		});
	}

	private _createElement() {
		this._element = document?.createElement("div");
		this._element.dataset.type = "article-search";
	}

	public updateDecorations(decorations: CustomDecorations[]) {
		this.decorations = [...decorations];
		this.updateProps({ decorations: this.decorations });
	}

	public destroyEditor() {
		this.updateProps({ isOpen: false, editor: undefined });
	}

	public closeSearch() {
		this.updateProps({ isOpen: false });
	}

	public updateEditor(editor: Editor) {
		if (this.getProps().isOpen) this.updateProps({ editor });
		else this.silentUpdateProps({ editor });
		this._editor = editor;
	}
}

export default ArticleSearchHotkeyView;
