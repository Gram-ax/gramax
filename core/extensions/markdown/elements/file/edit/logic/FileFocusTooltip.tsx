import type { Environment } from "@app/resolveModule/env";
import type PageDataContext from "@core/Context/PageDataContext";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import Workspace from "@core-ui/ContextServices/Workspace";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import type { Editor } from "@tiptap/core";
import type { Mark } from "@tiptap/pm/model";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import getFirstPatentByName from "../../../../../../ui-logic/utils/getFirstPatentByName";
import getFocusMark from "../../../../elementsUtils/getFocusMark";
import getMarkPosition from "../../../../elementsUtils/getMarkPosition";
import BaseMark from "../../../../elementsUtils/prosemirrorPlugins/BaseMark";
import FileMenu from "../components/FileMenu";

class FileFocusTooltip extends BaseMark {
	constructor(
		view: EditorView,
		editor: Editor,
		private _apiUrlCreator: ApiUrlCreator,
		private _pageDataContext: PageDataContext,
		private _platform: Environment,
	) {
		super(view, editor);
		this.update(view);
	}

	update(view: EditorView, lastState?: EditorState) {
		const state = this._getState(view, lastState);
		if (!state) return;

		const { mark, position } = getFocusMark(state, "file");

		const { node: text } = this._view.domAtPos(position);
		const markPosition = mark ? getMarkPosition(state, state.selection.$anchor.pos, mark.type) : null;

		if (!text || !markPosition) return this._removeComponent();

		const element = getFirstPatentByName(text as HTMLElement, "gr-file");
		if (!element || element.tagName == "BODY") return;

		const aiEnabled = this._pageDataContext.conf.ai.enabled;

		this._setTooltipPosition(element);
		this._setComponent(
			<PageDataContextService.Provider value={this._pageDataContext}>
				<Workspace.Init pageProps={{ context: this._pageDataContext, data: null }}>
					<ApiUrlCreatorService.Provider value={this._apiUrlCreator}>
						<PlatformService.Provider value={this._platform}>
							<ResourceService.Provider>
								<FileMenu
									aiEnabled={aiEnabled}
									onDelete={() => this._delete(markPosition)}
									resourcePath={mark.attrs.resourcePath}
								/>
							</ResourceService.Provider>
						</PlatformService.Provider>
					</ApiUrlCreatorService.Provider>
				</Workspace.Init>
			</PageDataContextService.Provider>,
		);
	}

	private _delete({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		const transaction = this._editor.state.tr;
		transaction.removeMark(from, to, mark);
		this._editor.view.dispatch(transaction);
		this._editor.chain().focus(this._lastPosition).run();
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

export default FileFocusTooltip;
