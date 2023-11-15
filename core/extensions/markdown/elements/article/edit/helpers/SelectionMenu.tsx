import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ArticleProps } from "@core/SitePresenter/SitePresenter";
import HeadersMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Headers";
import InlineMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Inline";
import ListMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/List";
import TextMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Text";
import { Editor, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";
import Base from "../../../../elementsUtils/prosemirrorPlugins/Base";

class TextSelectionMenu extends Base {
	private _selectPosition: { x: number; y: number };
	private _timeoutId: NodeJS.Timeout = null;
	private _canBeDeleted: boolean;

	constructor(
		view: EditorView,
		editor: Editor,
		private _isMac: boolean,
		private _articleProps: ArticleProps,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(view, editor);
		window.addEventListener("keydown", this.keydown);
		window.addEventListener("mousedown", this._mousedown.bind(this));
	}

	override destroy() {
		this._removeComponent();
		window.removeEventListener("keydown", this.keydown);
		window.removeEventListener("mousedown", this._mousedown.bind(this));
	}

	update(view, prevState) {
		const { from, to } = view.state.selection;
		if (prevState && prevState.selection.from === from && prevState.selection.to === to) return;
		const selectedText = view.state.doc.textBetween(from, to);
		if (selectedText) {
			if (this._timeoutId) clearTimeout(this._timeoutId);
			if (this._componentIsSet) this._setTooltip();
			else this._timeoutId = setTimeout(this._setTooltip.bind(this), 300);
		} else {
			this._removeComponent();
		}
	}

	private keydown = (e: KeyboardEvent) => {
		if (e.key == "Escape" || e.key == "Backspace") this._removeComponent();
	};

	private _click() {
		if (this._canBeDeleted) this._removeComponent();
		this._canBeDeleted = true;
	}

	private _mousedown() {
		if (!this._componentIsSet) this._canBeDeleted = false;
		else this._canBeDeleted = true;
	}

	private _setTooltip() {
		const { from, to } = this._view.state.selection;
		const selectedText = this._view.state.doc.textBetween(from, to);
		if (!selectedText) return;
		const anchor = this._view.coordsAtPos(from);
		this._selectPosition = { x: anchor.left, y: anchor.top };
		this._setTooltipPosition();
		this._setComponent(
			<IsMacService.Provider value={this._isMac}>
				<ArticlePropsService.Provider value={this._articleProps}>
					<ApiUrlCreatorService.Provider value={this._apiUrlCreator}>
						<PageDataContextService.Provider value={this._pageDataContext}>
							<ModalLayoutDark>
								<ButtonsLayout onClick={this._click.bind(this)}>
									<IsSelectedOneNodeService.Provider editor={this._editor}>
										<ButtonStateService.Provider editor={this._editor}>
											<HeadersMenuGroup editor={this._editor} />
											<div className="divider" />
											<TextMenuGroup editor={this._editor} />
											<div className="divider" />
											<ListMenuGroup editor={this._editor} />
											<div className="divider" />
											<InlineMenuGroup
												editor={this._editor}
												onFileSave={this._click.bind(this)}
												onClick={() => (this._canBeDeleted = false)}
											/>
										</ButtonStateService.Provider>
									</IsSelectedOneNodeService.Provider>
								</ButtonsLayout>
							</ModalLayoutDark>
						</PageDataContextService.Provider>
					</ApiUrlCreatorService.Provider>
				</ArticlePropsService.Provider>
			</IsMacService.Provider>,
		);
	}

	protected _setTooltipPosition = () => {
		const yDistance = -45;
		const tooltipWidth = 384;

		const x = this._selectPosition.x;
		const y = this._selectPosition.y;

		const endPosition = { left: x, top: y };
		const domReact = this._view.dom.getBoundingClientRect();

		const left = endPosition.left - domReact.left;
		this._tooltip.style.top = endPosition.top - domReact.top + yDistance + "px";
		this._tooltip.style.left = this._tooltip.style.right = null;
		if (left + tooltipWidth / 2 > domReact.width) this._tooltip.style.right = "0px";
		else if (left < tooltipWidth / 2) this._tooltip.style.left = "0px";
		else this._tooltip.style.left = left - tooltipWidth / 2 + "px";
	};
}

const SelectionMenu = Extension.create({
	name: "selectionMenu",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("selectionMenu"),
				view: (view) => {
					return new TextSelectionMenu(
						view,
						this.editor,
						this.options.isMac,
						this.options.articleProps,
						this.options.apiUrlCreator,
						this.options.pageDataContext,
					);
				},
			}),
		];
	},
});

export default SelectionMenu;
