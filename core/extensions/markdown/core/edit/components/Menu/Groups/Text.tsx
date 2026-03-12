import EmMenuButton from "@ext/markdown/elements/em/edit/components/EmMenuButton";
import HighlightMenuButton from "@ext/markdown/elements/highlight/edit/components/HighlightMenuButton";
import StrikeMenuButton from "@ext/markdown/elements/strikethrough/edit/components/StrikeMenuButton";
import StrongMenuButton from "@ext/markdown/elements/strong/edit/components/StrongMenuButton";
import { getPluginComponents } from "@plugins/store";
import type { Editor } from "@tiptap/core";
import { ToolbarSeparator } from "@ui-kit/Toolbar";

export interface TextMenuGroupButtons {
	strong?: boolean;
	em?: boolean;
	strike?: boolean;
	highlight?: boolean;
}

interface TextMenuGroupProps {
	editor?: Editor;
	isSelectionMenu?: boolean;
	buttons?: TextMenuGroupButtons;
}

const TextMenuGroup = ({ editor, isSelectionMenu = false, buttons }: TextMenuGroupProps) => {
	const { strong = true, em = true, strike = true, highlight = true } = buttons || {};

	return (
		<>
			{strong && <StrongMenuButton editor={editor} />}
			{em && <EmMenuButton editor={editor} />}
			{strike && <StrikeMenuButton editor={editor} />}
			{isSelectionMenu && highlight && (
				<>
					<ToolbarSeparator />
					<HighlightMenuButton editor={editor} />
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
