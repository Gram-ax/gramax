import getFirstPatentByName from "@core-ui/utils/getFirstPatentByName";
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

//  import { logger } from "../../../../../../../target/browser/src/debug";

class LinkFocusTooltip extends BaseMark {
	private _itemLinks: LinkItem[];

	constructor(view: EditorView, editor: Editor, private _apiUrlCreator: ApiUrlCreator) {
		super(view, editor);
		this._loadLinkItems();
		this._tooltip.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key == "Escape" || e.key == "Tab") this._editor.commands.focus(this._lastPosition);
			e.stopImmediatePropagation();
		});
		this.update(view);
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
			<LinkMenu
				href={this._getHref(mark)}
				value={this._getValue(mark)}
				itemLinks={this._itemLinks}
				onDelete={() => this._delete(markPosition)}
				onUpdate={(v, href) => {
					this._update(v, href, markPosition);
					this._removeComponent();
				}}
			/>,
		);
	}

	private _getHref(mark: Mark) {
		if (mark.attrs?.newHref) return mark.attrs.newHref;
		return (
			(mark.attrs.href.slice(0, 4) == "http" ? mark.attrs.href : "/" + mark.attrs.href) +
			(mark?.attrs?.hash ?? "")
		);
	}

	private _getValue(mark: Mark) {
		const href =
			mark.attrs.resourcePath && mark.attrs.resourcePath !== "" ? mark.attrs.resourcePath : mark.attrs.href;
		return (href ?? "") + (mark.attrs.hash ?? "");
	}

	private _delete({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		this._editor.view.dispatch(transaction);
		this._editor.chain().focus(this._lastPosition).run();
	}

	private _getHashHatch = (href: string) => {
		return href.match(/^(.+?)(#.+)?$/);
	};

	private _update(href: string, newHref: string, { from, to, mark }: { from: number; to: number; mark: Mark }) {
		let hash = "";
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		const hashHatch = this._getHashHatch(href);
		if (hashHatch) {
			href = hashHatch[1];
			hash = hashHatch?.[2] ?? "";
		}
		if (mark.attrs.resourcePath) (mark as any).attrs = { ...mark.attrs, resourcePath: href, hash, newHref };
		else
			(mark as any).attrs = {
				...mark.attrs,
				href: href,
				hash,
				newHref,
			};

		// GXS-1126
		// logger.logInfo(mark);

		transaction.addMark(from, to, mark);
		this._editor.view.dispatch(transaction);
	}

	private _loadLinkItems = async () => {
		const res = await FetchService.fetch(this._apiUrlCreator.getLinkItems());
		if (!res.ok) return;
		this._itemLinks = await res.json();
	};

	protected _setTooltipPosition = (element: HTMLElement) => {
		const distance = 0;
		const tooltipWidth = 300;
		const domReact = this._view.dom.getBoundingClientRect();
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
