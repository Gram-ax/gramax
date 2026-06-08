import type PageDataContext from "@core/Context/PageDataContext";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { FragmentLinkHoverTooltip } from "@ext/markdown/elements/fragment-link/edit/logic/FragmentLinkHoverTooltip";
import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

export function fragmentLinkHoverPlugin(
	editor: Editor,
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
): Plugin {
	let tooltip: FragmentLinkHoverTooltip | null = null;

	editor.on("destroy", () => {
		tooltip?.closeComponent();
	});

	return new Plugin({
		props: {
			handleDOMEvents: {
				mouseover: (_view, event) => {
					const target = event.target as HTMLElement;
					const markEl = target.closest("span.fragment-link-mark") as HTMLElement | null;

					if (markEl?.closest(".ProseMirror")) {
						const fragmentId = markEl.getAttribute("data-fragment-link");
						if (!fragmentId) return;

						if (tooltip?.element === markEl) return;

						tooltip?.closeComponent();
						tooltip = null;

						tooltip = new FragmentLinkHoverTooltip(document.body, apiUrlCreator, pageDataContext);
						tooltip.onDestroy = () => {
							tooltip = null;
						};
						tooltip.setFragmentId(fragmentId, apiUrlCreator);
						tooltip.setComponent(markEl);
					}
				},
			},
		},
		key: new PluginKey("fragmentLinkHover"),
	});
}
