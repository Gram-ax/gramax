import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import TextPrettify from "@ext/ai/components/Buttons/TextPrettify";
import useSupportedElements from "@ext/markdown/core/edit/components/Menu/Groups/hooks/useSupportedElements";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import CommentMenuButton from "@ext/markdown/elements/comment/edit/components/CommentMenuButton";
import { FileMenuButton } from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import FragmentLinkMenuButton from "@ext/markdown/elements/fragment-link/edit/components/FragmentLinkMenuButton";
import LinkMenuButton from "@ext/markdown/elements/link/edit/components/LinkMenuButton";
import type { Editor } from "@tiptap/core";
import { ToolbarSeparator } from "@ui-kit/Toolbar";

export interface InlineMenuGroupButtons {
	link?: boolean;
	file?: boolean;
	code?: boolean;
	comment?: boolean;
	prettify?: boolean;
	fragmentLink?: boolean;
}

interface InlineMenuGroupProps {
	editor?: Editor;
	onClick?: () => void;
	buttons?: InlineMenuGroupButtons;
}

const InlineMenuGroup = ({ editor, onClick, buttons }: InlineMenuGroupProps) => {
	const {
		link = true,
		file = true,
		code = true,
		comment = true,
		prettify = true,
		fragmentLink = true,
	} = buttons || {};
	const isGramaxAiEnabled = PageDataContext.value?.conf?.ai?.enabled;
	const { isCommentSupported } = useSupportedElements();

	return (
		<>
			{link && <LinkMenuButton editor={editor} onClick={onClick} />}
			{code && <CodeMenuButton editor={editor} isInline />}
			{file && <FileMenuButton editor={editor} onSave={onClick} />}
			{fragmentLink && <FragmentLinkMenuButton editor={editor} />}
			{isCommentSupported && comment && (
				<>
					<ToolbarSeparator />
					{comment && <CommentMenuButton editor={editor} />}
				</>
			)}
			{isGramaxAiEnabled && prettify && (
				<>
					{!isCommentSupported && !comment && <ToolbarSeparator />}
					<TextPrettify editor={editor} />
				</>
			)}
		</>
	);
};

export default InlineMenuGroup;
