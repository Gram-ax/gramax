import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import InlineEditPanel from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { Editor, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";
import Base from "../../../../elementsUtils/prosemirrorPlugins/Base";
import { EditorState } from "@tiptap/pm/state";

class TextSelectionMenu extends Base {
	private _selectPosition: { x: number; y: number };
	private _timeoutId: NodeJS.Timeout = null;

	constructor(
		view: EditorView,
		editor: Editor,
		private _isMac: boolean,
		private _articleProps: ClientArticleProps,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(view, editor);
	}

	updateEditor(newEditor) {
		this._editor = newEditor;
		this._setTooltip();
	}

	update(view: EditorView, prevState: EditorState) {
		const { from, to, $from } = view.state.selection;
		if (prevState && prevState.selection.from === from && prevState.selection.to === to) return;
		const selectedText = view.state.doc.textBetween(from, to);
		if (selectedText || view.state.doc.firstChild !== $from.parent) {
			if (this._timeoutId) clearTimeout(this._timeoutId);
			if (this._componentIsSet) this._setTooltip();
			else this._timeoutId = setTimeout(this._setTooltip.bind(this), 300);
		} else {
			this._removeComponent();
		}
	}

	removeMenu() {
		if (this._tooltip) this._closeHandler();
	}

	private _closeHandler() {
		this._removeComponent();
	}

	private _setTooltip() {
		const { from, to, $from } = this._view.state.selection;
		const selectedText = this._view.state.doc.textBetween(from, to);
		if (!selectedText || $from.parent.type.name === "doc" || this._view.state.doc.firstChild === $from.parent)
			return this._closeHandler();
		const anchor = this._view.coordsAtPos(from);
		this._selectPosition = { x: anchor.left, y: anchor.top };
		this._setTooltipPosition();
		this._setComponent(
			<IsMacService.Provider>
				<ArticlePropsService.Provider value={this._articleProps}>
					<ApiUrlCreatorService.Provider value={this._apiUrlCreator}>
						<PageDataContextService.Provider value={this._pageDataContext}>
							<ModalLayoutDark>
								<ButtonsLayout>
									<IsSelectedOneNodeService.Provider editor={this._editor}>
										<ButtonStateService.Provider editor={this._editor}>
											<InlineEditPanel
												editor={this._editor}
												closeHandler={() => this._closeHandler()}
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
		const domReact = this._view.dom.parentElement.getBoundingClientRect();

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
	addOptions() {
		return {};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("selectionMenu"),
				view: (view) => {
					const textSelectionMenu = new TextSelectionMenu(
						view,
						this.editor,
						this.options.isMac,
						this.options.articleProps,
						this.options.apiUrlCreator,
						this.options.pageDataContext,
					);
					this.editor.on("update", ({ editor }) => {
						textSelectionMenu.updateEditor(editor);
					});

					this.editor.on("blur", ({ event }) => {
						if (event.relatedTarget) textSelectionMenu.removeMenu();
					});

					return textSelectionMenu;
				},
			}),
		];
	},
});

export default SelectionMenu;
