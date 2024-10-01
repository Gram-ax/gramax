import getFirstPatentByName from "@core-ui/utils/getFirstPatentByName";
import eventEmitter from "@core/utils/eventEmitter";
import getFocusMarkFromSelection from "@ext/markdown/elementsUtils/getFocusMarkFromSelection";
import getMarkByPos from "@ext/markdown/elementsUtils/getMarkByPos";
import getMarkPosition from "@ext/markdown/elementsUtils/getMarkPosition";
import { Editor, JSONContent, MarkRange } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import Theme from "../../../../../Theme/Theme";
import ThemeService from "../../../../../Theme/components/ThemeService";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import Comment from "../components/Comment";

const COMMENT_COMPONENT = "COMMENT-REACT-COMPONENT";

class CommentFocusTooltip extends BaseMark {
	private _oldMark: Mark;
	private _oldMarkPosition: { from: number; to: number; mark: Mark };
	private _onCommentClick: any;
	private _onCreateCommentHandler: any;
	private _mouseUpHandler: any;
	private _mouseDownHandler: any;
	private _keydownHandlerEvent: any;
	private _mouseDownInTooltip: boolean;
	constructor(
		view: EditorView,
		editor: Editor,
		private _theme: Theme,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(view, editor);
		this._mouseDownInTooltip = true;
		this._onCommentClick = this._onClickComment.bind(this);
		this._mouseUpHandler = this._mouseUp.bind(this);
		this._mouseDownHandler = this._mouseDown.bind(this);
		this._keydownHandlerEvent = this._keydownHandler.bind(this);
		this._onCreateCommentHandler = this._onCreateComment.bind(this);

		document.addEventListener("keydown", this._keydownHandlerEvent);
		document.addEventListener("mouseup", this._mouseUpHandler);
		document.addEventListener("mousedown", this._mouseDownHandler);

		eventEmitter.on("addComment", this._onCreateCommentHandler);
		eventEmitter.on("onClickComment", this._onCommentClick);
	}
	update() {}

	destroy() {
		document.removeEventListener("keydown", this._keydownHandlerEvent);
		document.removeEventListener("mouseup", this._mouseUpHandler);
		document.addEventListener("mousedown", this._mouseDownHandler);
		eventEmitter.off("addComment", this._onCreateCommentHandler);
		eventEmitter.off("onClickComment", this._onCommentClick);
		this._tooltip.remove();
	}

	protected _setTooltipPosition = () => {
		this._tooltip.style.fontSize = "14px";
		this._tooltip.style.zIndex = "100";
	};

	private _commentClick = (element: HTMLElement, mark: Mark, markPosition: MarkRange) => {
		this._oldMark = mark;
		this._oldMarkPosition = markPosition;
		this._setTooltipPosition();
		this._setComponent(
			<ThemeService.Provide value={this._theme}>
				<PageDataContextService.Provider value={this._pageDataContext}>
					<Comment
						view={this._view}
						mark={mark}
						element={element}
						onDelete={() => this._delete(this._oldMarkPosition)}
						onUpdate={(c) => this._updateComment(markPosition, c)}
						onConfirm={(c) => this._createComment(markPosition, c)}
					/>
				</PageDataContextService.Provider>
			</ThemeService.Provide>,
		);
	};

	private _onClickComment({ dom }: { dom: HTMLElement }) {
		const state = this._getState(this._view);
		if (!state) return;

		const pos = this._view.posAtDOM(dom, 0);
		if (pos < 0) return;
		const mark = getMarkByPos(state, pos, "comment");

		if (this._componentIsSet) return;

		if (mark) this._commentClick(dom, mark, getMarkPosition(state, pos, mark.type));
	}

	private _onCreateComment(props: { pos: number; view: EditorView }) {
		const state = this._getState(props.view);
		if (!state) return;

		const { mark, position } = getFocusMarkFromSelection(state, "comment");
		if (!mark) return;

		const { node: text } = props.view.domAtPos(position, 1);
		const element = getFirstPatentByName(text as HTMLElement, "comment-react-component");
		element.click();
	}

	private _delete({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		this._removeComponent();
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
		this._removeComponent();
		eventEmitter.emit("addComment", { pos: markPosition.to - 1, view: this._view });
	}

	private _removeCommentComponent() {
		this._removeComponent();
		this._deleteIfNull();
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
		if (e.key == "Escape" && this._componentIsSet) this._removeCommentComponent();
	}

	private _mouseUp(e: MouseEvent) {
		if (this._mouseDownInTooltip) this._mouseDownInTooltip = false;
		const element = e.target as HTMLElement;

		if (!this._componentIsSet || this._mouseDownInTooltip) return;
		if (this._tooltip.contains(element) || element.classList.contains("article-page-wrapper")) return;
		if (element.tagName === COMMENT_COMPONENT) {
			const state = this._getState(this._view);
			if (state) {
				const pos = this._view.posAtDOM(element, 0);
				if (pos >= 0) {
					const mark = getMarkByPos(state, pos, "comment");
					if (this._oldMark === mark) return;
				}
			}
		}

		this._removeCommentComponent();
	}

	private _mouseDown(e: MouseEvent) {
		if (this._tooltip.contains(e.target as HTMLElement)) this._mouseDownInTooltip = true;
	}
}

export default CommentFocusTooltip;
