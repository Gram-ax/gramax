import EmMenuButton from "@ext/markdown/elements/em/edit/components/EmMenuButton";
import HighlightMenuButton from "@ext/markdown/elements/highlight/edit/components/HighlightMenuButton";
import StrikeMenuButton from "@ext/markdown/elements/strikethrough/edit/components/StrikeMenuButton";
import StrongMenuButton from "@ext/markdown/elements/strong/edit/components/StrongMenuButton";
import { getPluginComponents } from "@plugins/store";
import type { Editor } from "@tiptap/core";
import { ToolbarSeparator } from "@ui-kit/Toolbar";

const TextMenuGroup = ({ editor, isSelectionMenu = false }: { editor?: Editor; isSelectionMenu?: boolean }) => {
	return (
		<>
			<StrongMenuButton editor={editor} />
			<EmMenuButton editor={editor} />
			<StrikeMenuButton editor={editor} />
			{isSelectionMenu && (
				<>
					<ToolbarSeparator />
					<HighlightMenuButton editor={editor} />
					<ToolbarSeparator />
				</>
			)}
			{getPluginComponents().map((Component, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: index used as key because the order of plugins is static
				<Component editor={editor} key={index} />
			))}
		</>
	);
};

export default TextMenuGroup;
