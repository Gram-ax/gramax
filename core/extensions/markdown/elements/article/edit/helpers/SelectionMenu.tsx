import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import canDisplayMenu from "@ext/markdown/elements/article/edit/helpers/canDisplayMenu";
import InlineEditPanel from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import TooltipBase from "@ext/markdown/elementsUtils/prosemirrorPlugins/TooltipBase";
import { Editor, Extension } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "prosemirror-state";
import { CellSelection, isInTable } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";

interface SelectionMenuProps {
	catalogProps: ClientCatalogProps;
	articleProps: ClientArticleProps;
	pageDataContext: PageDataContext;
	apiUrlCreator: ApiUrlCreator;
	editor: Editor;
	isCellSelection: boolean;
	inTable: boolean;
	isMac: boolean;
	closeHandler: () => void;
	onMountCallback: () => void;
}

const SelectionMenuComponent = (props: SelectionMenuProps) => {
	const {
		pageDataContext,
		apiUrlCreator,
		editor,
		closeHandler,
		onMountCallback,
		isCellSelection,
		inTable,
		isMac,
		catalogProps,
		articleProps,
	} = props;

	const isGramaxAiEnabled = pageDataContext.conf.ai.enabled;

	return (
		<IsMacService.Provider value={isMac}>
			<ApiUrlCreatorService.Provider value={apiUrlCreator}>
				<PageDataContextService.Provider value={pageDataContext}>
					<CatalogPropsService.Provider value={catalogProps}>
						<ArticlePropsService.Provider value={articleProps}>
							<ResourceService.Provider>
								<ModalLayoutDark>
									<ButtonsLayout>
										<IsSelectedOneNodeService.Provider editor={editor}>
											<ButtonStateService.Provider editor={editor}>
												<InlineEditPanel
													editor={editor}
													closeHandler={closeHandler}
													onMountCallback={onMountCallback}
													isCellSelection={isCellSelection}
													inTable={inTable}
													isGramaxAiEnabled={isGramaxAiEnabled}
												/>
											</ButtonStateService.Provider>
										</IsSelectedOneNodeService.Provider>
									</ButtonsLayout>
								</ModalLayoutDark>
							</ResourceService.Provider>
						</ArticlePropsService.Provider>
					</CatalogPropsService.Provider>
				</PageDataContextService.Provider>
			</ApiUrlCreatorService.Provider>
		</IsMacService.Provider>
	);
};

class TextSelectionMenu extends TooltipBase {
	private _selectPosition: { x: number; y: number };
	private _inTable = false;
	private _isCellSelection = false;
	private _timeoutId: NodeJS.Timeout = null;
	private _isMount = false;

	constructor(
		private _view: EditorView,
		private _editor: Editor,
		isMac: boolean,
		private _catalogProps: ClientCatalogProps,
		private _articleProps: ClientArticleProps,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(
			SelectionMenuComponent,
			{
				isMac: isMac,
				catalogProps: _catalogProps,
				articleProps: _articleProps,
				pageDataContext: _pageDataContext,
				apiUrlCreator: _apiUrlCreator,
				editor: _editor,
				closeHandler: () => this.closeComponent(),
				onMountCallback: () => this._setIsMount(),
				isOpen: false,
			},
			_view.dom.parentElement,
		);
	}

	public updateEditor(newEditor) {
		this._editor = newEditor;
		this.updateProps({ editor: newEditor });
	}

	public override destroy() {
		this.closeComponent();
	}

	public closeComponent() {
		if (this.getProps().isOpen) {
			this._isMount = false;
			this.updateProps({ isOpen: false });
		}
	}

	public update(view: EditorView, prevState: EditorState) {
		const canDisplay = canDisplayMenu(this._editor);
		if (!canDisplay) return;

		const { from, to } = view.state.selection;
		this._updateTableSelection();
		if (prevState && prevState.selection.from === from && prevState.selection.to === to && !this._inTable) return;
		const selectedText = view.state.doc.textBetween(from, to);

		this.updateProps({
			catalogProps: this._catalogProps,
			articleProps: this._articleProps,
			pageDataContext: this._pageDataContext,
			apiUrlCreator: this._apiUrlCreator,
			editor: this._editor,
			inTable: this._inTable,
			isCellSelection: this._isCellSelection,
		});

		if (selectedText || this._isCellSelection) {
			if (this._timeoutId) clearTimeout(this._timeoutId);
			if (this._isMount) return this._setTooltip();

			this._timeoutId = setTimeout(() => this._setTooltip(), 300);
		} else {
			this.closeComponent();
		}
	}

	override setTooltipPosition = () => {
		const yDistance = -45;
		const isInstanceSelection = this._view.state.selection instanceof CellSelection;
		const tooltipWidth = isInstanceSelection ? 384 : 124;

		const x = this._selectPosition.x;
		const y = this._selectPosition.y;

		const endPosition = { left: x, top: y };
		const domReact = this._view.dom.parentElement.getBoundingClientRect();

		const left = endPosition.left - domReact.left;
		this._element.style.top = endPosition.top - domReact.top + yDistance + "px";
		this._element.style.left = this._element.style.right = null;
		if (left + tooltipWidth / 2 > domReact.width) this._element.style.right = "0px";
		else this._element.style.left = left + "px";
		this._element.style.zIndex = "var(--z-index-popover)";
	};

	private _updateTableSelection(): boolean {
		const selection = this._view.state.selection;
		const cellInstance = selection instanceof CellSelection;
		if (cellInstance) {
			this._isCellSelection = cellInstance;
			this._inTable = true;
			return true;
		}

		const inTable = isInTable(this._view.state);
		if (inTable) {
			this._inTable = true;
			this._isCellSelection = false;
			return true;
		}

		this._inTable = false;
		this._isCellSelection = false;
		return false;
	}

	private _setTooltip() {
		const { from, to, $from } = this._view.state.selection;
		const isInstanceSelection = this._view.state.selection instanceof CellSelection;
		const inTable = this._inTable;
		const selectedText = this._view.state.doc.textBetween(from, to) || inTable;

		if ((!selectedText && !isInstanceSelection) || this._view.state.doc.firstChild === $from.parent) {
			return this.closeComponent();
		}

		const anchor = this._view.coordsAtPos(from);
		const icrAnchor = this._view.coordsAtPos(from + 1);

		const needUseIncremented = anchor.top < icrAnchor.top;

		this._selectPosition = needUseIncremented
			? { x: icrAnchor.left, y: icrAnchor.top }
			: { x: anchor.left, y: anchor.top };

		this.setTooltipPosition();
		if (!this.getProps().isOpen) this.updateProps({ isOpen: true });
	}

	private _setIsMount() {
		this._isMount = true;
	}
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
						this.options.isMac === "true",
						this.options.catalogProps,
						this.options.articleProps,
						this.options.apiUrlCreator,
						this.options.pageDataContext,
					);

					this.editor.on("update", ({ editor }) => {
						textSelectionMenu.updateEditor(editor);
					});

					return textSelectionMenu;
				},
			}),
		];
	},
});

export default SelectionMenu;
