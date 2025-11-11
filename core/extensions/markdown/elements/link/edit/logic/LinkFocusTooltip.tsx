import Tooltip from "@components/Atoms/Tooltip";
import LinkTitleContextService from "@core-ui/ContextServices/LinkTitleTooltip";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import getFirstPatentByName from "@core-ui/utils/getFirstPatentByName";
import isURL from "@core-ui/utils/isURL";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Instance, Props } from "tippy.js";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import LinkItem from "../../../../../article/LinkCreator/models/LinkItem";
import getFocusMark from "../../../../elementsUtils/getFocusMark";
import getMarkPosition from "../../../../elementsUtils/getMarkPosition";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import LinkMenu from "../components/LinkMenu";

let callbackLink: () => void;

function callback(linkFocusTooltip: LinkFocusTooltip) {
	linkFocusTooltip.lastInputMethod = "mouse";
}

class LinkFocusTooltip extends BaseMark {
	private _itemLinks: LinkItem[];
	private _lastInputMethod: string;
	private _clearLastMark: () => void;
	private _tippy: Instance<Props>;
	private _lastMarkPosition: { from: number; to: number };
	private _zIndex: number;

	constructor(view: EditorView, editor: Editor, private _apiUrlCreator: ApiUrlCreator) {
		super(view, editor);
		void this._loadLinkItems();
		this.update(view);
		this._initLastInputListener();
		this._initEditorKeydownListener();
		this._zIndex = 49;
	}

	update(view: EditorView, lastState?: EditorState) {
		const state = this._getState(view, lastState);
		if (!state) return;

		const { mark, position } = getFocusMark(state, "link");

		const { node: text } = this._view.domAtPos(position);
		const markPosition = mark ? getMarkPosition(state, state.selection.$anchor.pos, mark.type) : null;

		if (!text || !markPosition) return this._removeComponent();

		const element = getFirstPatentByName(text as HTMLElement, "a");
		if (!element || element.tagName == "BODY") return;

		const markValue = this._getValue(mark) || "";
		if (this._lastMarkPosition?.from === markPosition?.from && this._lastMarkPosition?.to === markPosition?.to)
			return;

		this._lastMarkPosition = markPosition;

		this._clearLastMark = () => {
			if (!this._componentIsSet) return;
			if (!markValue) this._delete(markPosition);
			this._lastMarkPosition = null;
		};

		if (this._tippy) {
			this._tippy.hide();
			this._tippy.destroy();
			this._tippy = null;
		}

		// Legacy, need to refactor with normal tiptap example, like a new comments
		setTimeout(() => {
			this._setComponent(
				<Tooltip
					appendTo={() => document.body}
					onMount={(instance) => {
						this._tippy = instance;
						requestAnimationFrame(() => {
							if (this._tippy?.popperInstance) this._tippy.popperInstance.forceUpdate();
						});
					}}
					reference={element}
					visible
					distance={0}
					placement="bottom-start"
					arrow={false}
					zIndex={this._zIndex}
					hideOnClick={false}
					hideInMobile={false}
					popperOptions={{
						modifiers: [
							{
								name: "preventOverflow",
								options: {
									boundary: this._view.dom.parentElement,
								},
							},
						],
					}}
					customStyle
					interactive
					content={
						<LinkTitleContextService.Provider apiUrlCreator={this._apiUrlCreator}>
							<LinkMenu
								focusOnMount={this._lastInputMethod === "mouse"}
								href={this._getHref(mark)}
								closeMenu={() => this._closeComponent()}
								value={markValue}
								itemLinks={this._itemLinks}
								onDelete={() => this._delete(markPosition)}
								onUpdate={(v, href) => {
									this._update(v, href, markPosition);
									this._removeComponent(true);
								}}
							/>
						</LinkTitleContextService.Provider>
					}
				/>,
			);
		});
	}

	destroy() {
		if (this._tippy) {
			this._tippy.destroy();
			this._tippy = null;
		}

		super.destroy();
	}

	static getLinkToHeading = (href: string) => {
		return href.match(/^(.*?)(#.+)$/);
	};

	set lastInputMethod(value: string) {
		this._lastInputMethod = value;
	}

	protected override _removeComponent(dodgeClear?: boolean) {
		if (this._tippy) {
			this._tippy.destroy();
			this._tippy = null;
		}

		this._lastMarkPosition = null;
		dodgeClear || this._clearLastMark?.();
		super._removeComponent();
	}

	private _getHref(mark: Mark) {
		const { attrs } = mark;
		if (attrs?.newHref) return attrs.newHref;

		const href = attrs.href;
		if (typeof href === "string" && href.startsWith("#") && href.length > 1) {
			return href + (mark?.attrs?.hash ?? "");
		}

		return (isURL(href) ? href : "/" + href) + (mark?.attrs?.hash ?? "");
	}

	private _getValue(mark: Mark) {
		const { attrs } = mark;
		const href = attrs.resourcePath ? attrs.resourcePath : attrs.href;
		return (href ?? "") + (attrs.hash ?? "");
	}

	private _delete({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		this._editor.view.dispatch(transaction);
		this._editor.commands.focus(this._lastPosition);
	}

	private _update(href: string, newHref: string, { from, to, mark }: { from: number; to: number; mark: any }) {
		let hash = "";
		const transaction = this._editor.state.tr;
		const text = this._editor.state.doc.textBetween(from, to, undefined, " ");
		transaction.removeMark(from, to, mark);
		const hashHatch = LinkFocusTooltip.getLinkToHeading(href);
		const { isExternal } = isExternalLink(newHref);
		const textIsLink = text === mark.attrs.href;
		if (isExternal && textIsLink) transaction.deleteRange(from, to);

		if (hashHatch) {
			href = hashHatch[1];
			hash = hashHatch?.[2] ?? "";
		}

		const resourcePath = isExternal ? newHref : href;

		mark.attrs = { ...mark.attrs, resourcePath, hash, href: newHref };

		if (isExternal && textIsLink) transaction.insertText(href, from);
		transaction.addMark(from, isExternal && textIsLink ? from + href.length : to, mark);
		this._clearLastMark = undefined;
		this._editor.view.dispatch(transaction);
	}

	private _loadLinkItems = async () => {
		if (!this._apiUrlCreator) return;
		const res = await FetchService.fetch(this._apiUrlCreator.getLinkItems());
		if (!res.ok) return;
		this._itemLinks = await res.json();
	};

	private _closeComponent() {
		this._removeComponent();
		this._editor.commands.focus(this._lastPosition);
	}

	private _initLastInputListener() {
		if (callbackLink) document.removeEventListener("mousedown", callbackLink);
		callbackLink = () => callback(this);
		document.addEventListener("mousedown", callbackLink);
	}

	private _initEditorKeydownListener() {
		this._editor.view.dom.addEventListener("keydown", (e) => {
			if (e.ctrlKey || (e.metaKey && e.code === "KeyK")) {
				this._lastInputMethod = "mouse";
				this.update(this._view);
			} else {
				this._lastInputMethod = "keyboard";
			}
		});
	}

	protected _setTooltipPosition = () => {};
}

export default LinkFocusTooltip;
