import getFirstPatentByName from "@core-ui/utils/getFirstPatentByName";
import commentEventEmitter from "@core/utils/commentEventEmitter";
import getFocusMarkFromSelection from "@ext/markdown/elementsUtils/getFocusMarkFromSelection";
import getMarkByPos from "@ext/markdown/elementsUtils/getMarkByPos";
import getMarkPosition from "@ext/markdown/elementsUtils/getMarkPosition";
import { Editor, JSONContent, MarkRange } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";
import { createContext } from "react";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import Theme from "../../../../../Theme/Theme";
import ThemeService from "../../../../../Theme/components/ThemeService";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import Comment from "../components/Comment";
import Tooltip from "@components/Atoms/Tooltip";
import { Instance, Props } from "tippy.js";

const COMMENT_COMPONENT = "COMMENT-REACT-COMPONENT";
export const GlobalEditorIsEditable = createContext<boolean>(null);

class CommentFocusTooltip extends BaseMark {
	private _oldMark: Mark;
	private _oldMarkPosition: { from: number; to: number; mark: Mark };
	private _onCommentClick: any;
	private _onCreateCommentHandler: any;
	private _mouseUpHandler: any;
	private _mouseDownHandler: any;
	private _keydownHandlerEvent: any;
	private _mouseDownInTooltip: boolean;
	private _tippy: Instance<Props>;
	constructor(view: EditorView, editor: Editor, private _theme: Theme, private _pageDataContext: PageDataContext) {
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

		commentEventEmitter.on("addComment", this._onCreateCommentHandler);
		commentEventEmitter.on("onClickComment", this._onCommentClick);
	}
	update() {}

	destroy() {
		document.removeEventListener("keydown", this._keydownHandlerEvent);
		document.removeEventListener("mouseup", this._mouseUpHandler);
		document.addEventListener("mousedown", this._mouseDownHandler);
		commentEventEmitter.off("addComment", this._onCreateCommentHandler);
		commentEventEmitter.off("onClickComment", this._onCommentClick);

		if (this._tippy) this._tippy.destroy();
		this._tooltip.remove();
	}

	protected _setTooltipPosition = () => {};

	private _commentClick = (element: HTMLElement, mark: Mark, markPosition: MarkRange) => {
		this._oldMark = mark;
		this._oldMarkPosition = markPosition;
		this._setTooltipPosition();
		this._setComponent(
			<Tooltip
				onMount={(instance) => {
					this._tippy = instance;
				}}
				reference={element}
				visible
				placement="bottom-start"
				arrow={false}
				hideOnClick={false}
				appendTo={() => this._view.dom.parentElement}
				customStyle
				interactive
				content={
					<ThemeService.Provide value={this._theme}>
						<PageDataContextService.Provider value={this._pageDataContext}>
							<GlobalEditorIsEditable.Provider value={this._editor.isEditable}>
								<Comment
									view={this._view}
									mark={mark}
									element={element}
									onDelete={() => this._delete(this._oldMarkPosition)}
									onUpdate={(c) => this._updateComment(markPosition, c)}
									onConfirm={(c) => this._createComment(markPosition, c)}
								/>
							</GlobalEditorIsEditable.Provider>
						</PageDataContextService.Provider>
					</ThemeService.Provide>
				}
			/>,
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

	private _createComment(markPosition: { from: number; to: number; mark: Mark }, content: JSONContent[]) {
		this._updateAttributes(markPosition, {
			preCount: markPosition.mark.attrs.preCount,
			count: markPosition.mark.attrs.preCount,
			comment: {
				user: { mail: this._pageDataContext.userInfo.mail, name: this._pageDataContext.userInfo.name },
				dateTime: new Date().toJSON(),
				content,
			},
			answers: [],
		} as CommentBlock);
		this._removeComponent();

		setTimeout(() => {
			commentEventEmitter.emit("addComment", { pos: markPosition.to - 1, view: this._view });
		}, 0);
	}

	private _removeCommentComponent() {
		this._removeComponent();
		this._deleteIfNull();
	}

	protected _removeComponent() {
		if (this._tippy) {
			this._tippy.destroy();
			this._tippy = null;
		}

		super._removeComponent();
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
		if (!this._tippy) return;
		const popper = this._tippy.popper;
		const element = e.target as HTMLElement;

		if (!this._componentIsSet || this._mouseDownInTooltip) return;
		if (popper.contains(element) || element.classList.contains("article-page-wrapper")) return;
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
		if (!this._tippy) return;
		const popper = this._tippy.popper;
		if (popper.contains(e.target as HTMLElement)) this._mouseDownInTooltip = true;
	}
}

export default CommentFocusTooltip;
