import LinkTitleContextService from "@core-ui/ContextServices/LinkTitleTooltip";
import getFirstPatentByName from "@core-ui/utils/getFirstPatentByName";
import isURL from "@core-ui/utils/isURL";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import LinkItem from "../../../../../artilce/LinkCreator/models/LinkItem";
import getFocusMark from "../../../../elementsUtils/getFocusMark";
import getMarkPosition from "../../../../elementsUtils/getMarkPosition";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import LinkMenu from "../components/LinkMenu";

class LinkFocusTooltip extends BaseMark {
	private _itemLinks: LinkItem[];
	private _lastInputMethod: string;

	constructor(view: EditorView, editor: Editor, private _apiUrlCreator: ApiUrlCreator) {
		super(view, editor);
		void this._loadLinkItems();
		this.update(view);
		this._editor.view.dom.addEventListener("mousedown", () => (this._lastInputMethod = "mouse"));
		this._editor.view.dom.addEventListener("keydown", () => (this._lastInputMethod = "keyboard"));
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

		this._setTooltipPosition(element);

		this._setComponent(
			<LinkTitleContextService.Provider apiUrlCreator={this._apiUrlCreator}>
				<LinkMenu
					focusOnMount={this._lastInputMethod === "mouse"}
					href={this._getHref(mark)}
					closeMenu={() => this._closeComponent()}
					value={this._getValue(mark)}
					itemLinks={this._itemLinks}
					onDelete={() => this._delete(markPosition)}
					onUpdate={(v, href) => {
						this._update(v, href, markPosition);
						this._removeComponent();
					}}
				/>
			</LinkTitleContextService.Provider>,
		);
	}

	static getLinkToHeading = (href: string) => {
		return href.match(/^(.*?)(#.+)$/);
	};

	private _getHref(mark: Mark) {
		const { attrs } = mark;
		if (attrs?.newHref) return attrs.newHref;
		return (isURL(attrs.href) ? attrs.href : "/" + attrs.href) + (mark?.attrs?.hash ?? "");
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
		transaction.removeMark(from, to, mark);
		const hashHatch = LinkFocusTooltip.getLinkToHeading(href);

		if (hashHatch) {
			href = hashHatch[1];
			hash = hashHatch?.[2] ?? "";
		}

		mark.attrs = { ...mark.attrs, resourcePath: href, hash, newHref };

		transaction.addMark(from, to, mark);
		this._editor.view.dispatch(transaction);
	}

	private _loadLinkItems = async () => {
		const res = await FetchService.fetch(this._apiUrlCreator.getLinkItems());
		if (!res.ok) return;
		this._itemLinks = await res.json();
	};

	private _closeComponent() {
		this._removeComponent();
		this._editor.commands.focus(this._lastPosition);
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

export default LinkFocusTooltip;
