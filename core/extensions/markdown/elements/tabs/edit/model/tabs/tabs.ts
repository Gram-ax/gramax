import t from "@ext/localization/locale/translate";
import tabsSchema from "@ext/markdown/elements/tabs/edit/model/tabs/tabsSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditTabs from "../../components/EditTabs";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		tabs: { setTabs: () => ReturnType };
	}
}

const Tabs = Node.create({
	...getExtensionOptions({ schema: tabsSchema, name: "tabs" }),

	parseHTML() {
		return [{ tag: "tabs-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["tabs-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditTabs);
	},

	addCommands() {
		return {
			setTabs:
				() =>
				({ chain }) => {
					const tabAttrs = { name: t("editor.tabs.name"), idx: 0 };
					return chain().insertContent({
						type: this.name,
						attrs: { childAttrs: [tabAttrs] },
						content: [
							{
								type: "tab",
								attrs: tabAttrs,
								content: [{ type: "paragraph", content: [] }],
							},
						],
					});
				},
		};
	},
});

export default Tabs;
