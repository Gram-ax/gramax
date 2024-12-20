import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import InlineEditPanel from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import TooltipBase from "@ext/markdown/elementsUtils/prosemirrorPlugins/TooltipBase";
import { Editor, Extension } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import PageDataContext from "../../../../../../logic/Context/PageDataContext";

interface SelectionMenuProps {
	articleProps: ClientArticleProps;
	pageDataContext: PageDataContext;
	apiUrlCreator: ApiUrlCreator;
	editor: Editor;
	closeHandler: () => void;
	onMountCallback: () => void;
}

const SelectionMenuComponent = (props: SelectionMenuProps) => {
	const { pageDataContext, apiUrlCreator, editor, closeHandler, onMountCallback } = props;
	return (
		<IsMacService.Provider>
			<ApiUrlCreatorService.Provider value={apiUrlCreator}>
				<PageDataContextService.Provider value={pageDataContext}>
					<ModalLayoutDark>
						<ButtonsLayout>
							<IsSelectedOneNodeService.Provider editor={editor}>
								<ButtonStateService.Provider editor={editor}>
									<InlineEditPanel
										editor={editor}
										closeHandler={closeHandler}
										onMountCallback={onMountCallback}
									/>
								</ButtonStateService.Provider>
							</IsSelectedOneNodeService.Provider>
						</ButtonsLayout>
					</ModalLayoutDark>
				</PageDataContextService.Provider>
			</ApiUrlCreatorService.Provider>
		</IsMacService.Provider>
	);
};

class TextSelectionMenu extends TooltipBase {
	private _selectPosition: { x: number; y: number };
	private _timeoutId: NodeJS.Timeout = null;
	private _isMount = false;

	constructor(
		private _view: EditorView,
		private _editor: Editor,
		private _isMac: boolean,
		private _articleProps: ClientArticleProps,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
	) {
		super(
			SelectionMenuComponent,
			{
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
		const { from, to, $from } = view.state.selection;
		if (prevState && prevState.selection.from === from && prevState.selection.to === to) return;
		const selectedText = view.state.doc.textBetween(from, to);

		this.updateProps({
			articleProps: this._articleProps,
			pageDataContext: this._pageDataContext,
			apiUrlCreator: this._apiUrlCreator,
			editor: this._editor,
		});

		if (selectedText || view.state.doc.firstChild !== $from.parent) {
			if (this._timeoutId) clearTimeout(this._timeoutId);
			if (this._isMount) return this._setTooltip();

			this._timeoutId = setTimeout(() => this._setTooltip(), 300);
		} else {
			this.closeComponent();
		}
	}

	override setTooltipPosition = () => {
		const yDistance = -45;
		const tooltipWidth = 384;

		const x = this._selectPosition.x;
		const y = this._selectPosition.y;

		const endPosition = { left: x, top: y };
		const domReact = this._view.dom.parentElement.getBoundingClientRect();

		const left = endPosition.left - domReact.left;
		this._element.style.top = endPosition.top - domReact.top + yDistance + "px";
		this._element.style.left = this._element.style.right = null;
		if (left + tooltipWidth / 2 > domReact.width) this._element.style.right = "0px";
		else if (left < tooltipWidth / 2) this._element.style.left = "0px";
		else this._element.style.left = left - tooltipWidth / 2 + "px";
	};

	private _setTooltip() {
		const { from, to, $from } = this._view.state.selection;
		const selectedText = this._view.state.doc.textBetween(from, to);
		if (!selectedText || $from.parent.type.name === "doc" || this._view.state.doc.firstChild === $from.parent) {
			return this.closeComponent();
		}

		const anchor = this._view.coordsAtPos(from);
		this._selectPosition = { x: anchor.left, y: anchor.top };

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
						this.options.isMac,
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
