import { Editor, JSONContent } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import getFirstPatentByName from "../../../../../../ui-logic/utils/getFirstPatentByName";
import Theme from "../../../../../Theme/Theme";
import ThemeService from "../../../../../Theme/components/ThemeService";
import getFocusMark from "../../../../elementsUtils/getFocusMark";
import getMarkPosition from "../../../../elementsUtils/getMarkPosition";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import Comment from "../components/Comment";

class CommentFocusTooltip extends BaseMark {
	private _oldMark: Mark;
	private _oldMarkPosition: { from: number; to: number; mark: Mark };
	constructor(
		view: EditorView,
		editor: Editor,
		private _theme: Theme,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(view, editor);
		document.addEventListener("keydown", this._keydownHandler.bind(this));
		this.update(view);
	}

	public destroy() {
		document.removeEventListener("keydown", this._keydownHandler.bind(this));
		this._tooltip.remove();
	}

	update(view: EditorView, lastState?: EditorState) {
		const state = this._getState(view, lastState);
		if (!state) return;

		const { mark, position } = getFocusMark(state, "comment");

		const { node: text } = this._view.domAtPos(position);
		const markPosition = mark ? getMarkPosition(state, state.selection.$anchor.pos, mark.type) : null;

		if (!text || !markPosition) return this._removeCommentComponent();

		const element = getFirstPatentByName(text as HTMLElement, "comment-react-component");
		if (!element || element.tagName == "BODY") return;
		if (this._componentIsSet) {
			if (this._oldMark !== mark) this._removeCommentComponent();
			return;
		}
		this._oldMark = mark;
		this._oldMarkPosition = markPosition;
		this._setTooltipPosition(element);
		this._setComponent(
			<ThemeService.Provide value={this._theme}>
				<PageDataContextService.Provider value={this._pageDataContext}>
					<Comment
						mark={mark}
						element={element}
						onDelete={() => this._delete(markPosition)}
						onUpdate={(c) => this._updateComment(markPosition, c)}
						onCreateComment={(c) => this._createComment(markPosition, c)}
					/>
				</PageDataContextService.Provider>
			</ThemeService.Provide>,
		);
	}

	protected _setTooltipPosition = (element: HTMLElement) => {
		const tooltipWidth = 500;
		const tooltipHeight = document.documentElement.clientHeight / 2;
		const rect = element.getBoundingClientRect();
		const domReact = this._view.dom.getBoundingClientRect();

		this._tooltip.style.top = this._tooltip.style.bottom = null;
		const top = rect.top - domReact.top;
		if (tooltipHeight > domReact.height) this._tooltip.style.top = top + rect.height + "px";
		else {
			if (top + tooltipHeight > domReact.height) this._tooltip.style.bottom = domReact.height - top + "px";
			else this._tooltip.style.top = top + rect.height + "px";
		}

		this._tooltip.style.left = this._tooltip.style.right = null;
		const left = rect.left - domReact.left;

		if (left + tooltipWidth > domReact.width + 200)
			this._tooltip.style.right = domReact.width - (left + rect.width) + "px";
		else this._tooltip.style.left = left + "px";
		this._tooltip.style.zIndex = "100";
	};

	private _delete({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		this._editor.view.dispatch(transaction);
	}

	private _updateComment(markPosition: { from: number; to: number; mark: Mark }, commentBlock: CommentBlock) {
		if (!commentBlock) return;
		this._updateAttributes(markPosition, commentBlock);
	}

	private async _createComment(markPosition: { from: number; to: number; mark: Mark }, content: JSONContent[]) {
		const res = await FetchService.fetch(this._apiUrlCreator.getCommentCount());
		if (!res.ok) return;
		this._updateAttributes(markPosition, {
			count: await res.text(),
			comment: {
				user: { mail: this._pageDataContext.userInfo.mail, name: this._pageDataContext.userInfo.name },
				dateTime: new Date().toJSON(),
				content,
			},
			answers: [],
		} as CommentBlock);
		this._removeCommentComponent();
		this._editor.commands.focus(this._lastPosition + 1);
	}

	private _removeCommentComponent() {
		this._deleteIfNull();
		this._removeComponent();
	}

	private _deleteIfNull() {
		if (this._oldMarkPosition && this._oldMark) {
			if (this._oldMark.attrs.comment) return;
			this._delete(this._oldMarkPosition);
			this._oldMarkPosition = this._oldMark = null;
		}
	}

	private _updateAttributes(markPosition: { from: number; to: number; mark: Mark }, attrs) {
		const { from, to, mark } = markPosition;
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		(mark.attrs as any) = { ...attrs };
		transaction.addMark(from, to, mark);
		this._editor.view.dispatch(transaction);
	}

	private _keydownHandler(e: KeyboardEvent) {
		if (e.key == "Escape" && this._componentIsSet) {
			this._deleteIfNull();
			this._editor.commands.focus(this._lastPosition + 1);
		}
	}
}

export default CommentFocusTooltip;
