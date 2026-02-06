import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import TextPrettify from "@ext/ai/components/Buttons/TextPrettify";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import CommentMenuButton from "@ext/markdown/elements/comment/edit/components/CommentMenuButton";
import { FileMenuButton } from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import LinkMenuButton from "@ext/markdown/elements/link/edit/components/LinkMenuButton";
import { Editor } from "@tiptap/core";
import { ToolbarSeparator } from "@ui-kit/Toolbar";
import { useMemo } from "react";

interface InlineMenuGroupProps {
	editor?: Editor;
	onClick?: () => void;
}

const InlineMenuGroup = ({ editor, onClick }: InlineMenuGroupProps) => {
	const syntax = useCatalogPropsStore((state) => state.data.syntax);
	const isGramaxAiEnabled = PageDataContext.value?.conf?.ai?.enabled;

	const { isCommentSupported } = useMemo(() => {
		const supportedElements = getFormatterType(syntax).supportedElements;
		return {
			isCommentSupported: supportedElements.includes("comment"),
		};
	}, [syntax]);

	return (
		<>
			<LinkMenuButton editor={editor} onClick={onClick} />
			<CodeMenuButton editor={editor} isInline />
			<FileMenuButton editor={editor} onSave={onClick} />
			{isCommentSupported && (
				<>
					<ToolbarSeparator />
					<CommentMenuButton editor={editor} />
				</>
			)}
			{isGramaxAiEnabled && (
				<>
					{!isCommentSupported && <ToolbarSeparator />}
					<TextPrettify editor={editor} />
				</>
			)}
		</>
	);
};

export default InlineMenuGroup;
