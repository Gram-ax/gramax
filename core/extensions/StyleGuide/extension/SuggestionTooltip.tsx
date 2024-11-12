import BaseMark from "@ext/markdown/elementsUtils/prosemirrorPlugins/BaseMark";
import Replacer, { ReplacerProps } from "@ext/StyleGuide/components/Replacer";
import { Editor } from "@tiptap/core";
import { EditorView } from "prosemirror-view";

class SuggestionTooltip extends BaseMark {
	constructor(view: EditorView, editor: Editor) {
		super(view, editor);
	}

	public removeTooltip() {
		this._removeComponent();
	}

	setTooltip(element: HTMLElement, props: ReplacerProps): void {
		this._setTooltipPosition(element);
		this._setComponent(<Replacer {...props} onClick={props.onClick} />);
	}

	update() {}

	destroy() {}

	protected _setTooltipPosition(element: HTMLElement): void {
		const distance = 5;
		const tooltipWidth = 300;
		const domReact = this._view.dom.parentElement.getBoundingClientRect();
		const rect = element.getBoundingClientRect();
		const left = rect.left - domReact.left;
		this._tooltip.style.top = rect.top - domReact.top + rect.height + distance + "px";
		this._tooltip.style.left = this._tooltip.style.right = null;
		if (left + tooltipWidth > domReact.width)
			this._tooltip.style.right = domReact.width - (left + rect.width) + "px";
		else this._tooltip.style.left = left + "px";
	}
}

export default SuggestionTooltip;
