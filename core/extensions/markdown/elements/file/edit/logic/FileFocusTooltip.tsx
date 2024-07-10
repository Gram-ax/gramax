import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PageDataContext from "@core/Context/PageDataContext";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import getFirstPatentByName from "../../../../../../ui-logic/utils/getFirstPatentByName";
import getFocusMark from "../../../../elementsUtils/getFocusMark";
import getMarkPosition from "../../../../elementsUtils/getMarkPosition";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import FileMenu from "../components/FileMenu";

class FileFocusTooltip extends BaseMark {
	constructor(
		view: EditorView,
		editor: Editor,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(view, editor);
		this.update(view);
	}

	update(view: EditorView, lastState?: EditorState) {
		const state = this._getState(view, lastState);
		if (!state) return;

		const { mark, position } = getFocusMark(state, "file");

		const { node: text } = this._view.domAtPos(position);
		const markPosition = mark ? getMarkPosition(state, state.selection.$anchor.pos, mark.type) : null;

		if (!text || !markPosition) return this._removeComponent();

		const element = getFirstPatentByName(text as HTMLElement, "gr-file");
		if (!element || element.tagName == "BODY") return;

		this._setTooltipPosition(element);
		this._setComponent(
			<PageDataContextService.Provider value={this._pageDataContext}>
				<ApiUrlCreatorService.Provider value={this._apiUrlCreator}>
					<FileMenu resourcePath={mark.attrs.resourcePath} onDelete={() => this._delete(markPosition)} />
				</ApiUrlCreatorService.Provider>
			</PageDataContextService.Provider>,
		);
	}

	private _delete({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		this._editor.view.dispatch(transaction);
		this._editor.chain().focus(this._lastPosition).run();
	}

	protected _setTooltipPosition = (element: HTMLElement) => {
		const distance = 0;
		const tooltipWidth = 300;
		const domReact = this._view.dom.parentElement.getBoundingClientRect();
		const rect = element.getBoundingClientRect();
		const left = rect.left - domReact.left;
		this._tooltip.style.top = rect.top - domReact.top + rect.height + distance + "px";
		this._tooltip.style.left = this._tooltip.style.right = null;
		if (left + tooltipWidth > domReact.width)
			this._tooltip.style.right = domReact.width - (left + rect.width) + "px";
		else this._tooltip.style.left = left + "px";
	};
}

export default FileFocusTooltip;
