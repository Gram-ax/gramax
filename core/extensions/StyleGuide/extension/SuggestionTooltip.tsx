import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import BaseMark from "@ext/markdown/elementsUtils/prosemirrorPlugins/BaseMark";
import { Editor } from "@tiptap/core";
import { EditorView } from "prosemirror-view";

class SuggestionTooltip extends BaseMark {
	constructor(view: EditorView, editor: Editor) {
		super(view, editor);
	}

	public removeTooltip() {
		this._removeComponent();
	}

	setTooltip(
		element: HTMLElement,
		{ name, replaceText, description }: { name: string; replaceText: string; description: string },
		onClick: (replaceText: string, scloseFunc: () => void) => void,
	): void {
		this._setTooltipPosition(element);
		this._setComponent(
			<ModalLayoutDark>
				<ButtonsLayout>
					{name && (
						<>
							<div>{name}</div>
							<div className="divider" />
						</>
					)}
					{description && (
						<>
							<div>{description}</div>
							<div className="divider" />
						</>
					)}
					{replaceText !== null && replaceText !== undefined && (
						<>
							{replaceText && (
								<>
									<div>{replaceText}</div>
									<div className="divider" />
								</>
							)}
							<Button
								icon={replaceText ? "replace" : "trash"}
								tooltipText={replaceText ? "Заменить" : "Удалить"}
								onClick={() => onClick(replaceText, this._removeComponent.bind(this))}
							/>
						</>
					)}
				</ButtonsLayout>
			</ModalLayoutDark>,
		);
	}

	update() {}

	destroy() {}

	protected _setTooltipPosition(element: HTMLElement): void {
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
	}
}

export default SuggestionTooltip;
