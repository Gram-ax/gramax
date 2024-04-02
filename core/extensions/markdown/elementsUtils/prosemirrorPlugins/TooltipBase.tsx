import ReactRenderer from "@ext/markdown/elementsUtils/prosemirrorPlugins/ReactRenderer";
import { FC } from "react";

abstract class TooltipBase extends ReactRenderer {
	protected _element: HTMLElement;

	protected constructor(Component: FC, props: object, _parentElement: HTMLElement) {
		super(Component, props, _parentElement);

		this._createTooltip();
		this._initialization(this._element);
	}

	private _createTooltip() {
		this._element = document.createElement("div");
		this._element.style.position = "absolute";
	}

	protected setTooltipPosition(element: HTMLElement) {
		const distance = 0;
		const tooltipWidth = 300;
		const domReact = this._parentElement.getBoundingClientRect();
		const rect = element.getBoundingClientRect();
		const left = rect.left - domReact.left;
		this._element.style.top = rect.top - domReact.top + distance + "px";
		this._element.style.left = this._element.style.right = null;

		if (left + tooltipWidth > domReact.width) {
			this._element.style.right = domReact.width - (left + rect.width / 2) + "px";
		} else this._element.style.left = left + rect.width / 2 + "px";
	}
}

export default TooltipBase;
